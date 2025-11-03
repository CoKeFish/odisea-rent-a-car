use crate::{events, methods};
use crate::interfaces::contract::RentACarContractTrait;
use crate::methods::token::token::token_transfer;
use crate::storage::admin::{has_admin, read_admin, write_admin, read_admin_commission, write_admin_commission, read_admin_available_to_withdraw, write_admin_available_to_withdraw};
use crate::storage::car::{has_car, read_car, remove_car, write_car};
use crate::storage::contract_balance::{read_contract_balance, write_contract_balance};
use crate::storage::rental::{write_rental, remove_rental, has_rental};
use crate::storage::structs::car::Car;
use crate::storage::structs::rental::Rental;
use crate::storage::token::write_token;
use crate::storage::types::car_status::CarStatus;
use crate::storage::types::errors::Error;
use soroban_sdk::{contract, contractimpl, Address, Env};
use crate::methods::public;


#[contract]
pub struct RentACarContract;

#[contractimpl]
impl RentACarContractTrait for RentACarContract {
    fn __constructor(env: &Env, admin: Address, token: Address) -> Result<(), Error> {
        if admin == token {
            return Err(Error::AdminTokenConflict);
        }

        if has_admin(&env) {
            return Err(Error::ContractInitialized);
        }

        write_admin(env, &admin);
        write_token(env, &token);

        events::contract::contract_initialized(env, admin, token);

        Ok(())
    }

    fn add_car(env: &Env, owner: Address, price_per_day: i128) -> Result<(), Error> {
        let admin = read_admin(env)?;
        admin.require_auth();

        if price_per_day <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if has_car(env, &owner) {
            return Err(Error::CarAlreadyExist);
        }

        let car = Car {
            price_per_day,
            car_status: CarStatus::Available,
            available_to_withdraw: 0,
        };

        write_car(env, &owner, &car);
        events::add_car::car_added(env, owner, price_per_day);
        Ok(())
    }

    fn get_car_status(env: &Env, owner: Address) -> Result<CarStatus, Error> {
        public::get_car_status::get_car_status(env, &owner)
    }

    fn get_admin_available_to_withdraw(env: &Env) -> i128 {
        public::get_admin_available_to_withdraw::get_admin_available_to_withdraw(env)
    }

    fn rental(
        env: &Env,
        renter: Address,
        owner: Address,
        total_days_to_rent: u32,
        amount: i128,
    ) -> Result<(), Error> {
        renter.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if total_days_to_rent == 0 {
            return Err(Error::RentalDurationCannotBeZero);
        }

        if renter == owner {
            return Err(Error::SelfRentalNotAllowed);
        }

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        let mut car = read_car(env, &owner)?;

        if car.car_status != CarStatus::Available {
            return Err(Error::CarAlreadyRented);
        }

        car.car_status = CarStatus::Rented;
        
        let admin_commission = read_admin_commission(env);
        let total_amount = amount
            .checked_add(admin_commission)
            .ok_or(Error::OverflowError)?;

        // Owner receives the full rental amount (without commission deduction)
        car.available_to_withdraw = car
            .available_to_withdraw
            .checked_add(amount)
            .ok_or(Error::OverflowError)?;

        // Accumulate commission for admin
        let mut admin_available = read_admin_available_to_withdraw(env);
        admin_available = admin_available
            .checked_add(admin_commission)
            .ok_or(Error::OverflowError)?;
        write_admin_available_to_withdraw(env, admin_available);

        let rental = Rental {
            total_days_to_rent,
            amount,
        };

        let mut contract_balance = read_contract_balance(&env);
        // Contract balance includes both the rental amount and commission
        contract_balance = contract_balance
            .checked_add(total_amount)
            .ok_or(Error::OverflowError)?;

        write_contract_balance(&env, &contract_balance);
        write_car(env, &owner, &car);
        write_rental(env, &renter, &owner, &rental);

        // Renter pays the rental amount plus commission
        token_transfer(&env, &renter, &env.current_contract_address(), &total_amount)?;
        events::rental::rented(env, renter, owner, total_days_to_rent, amount);
        Ok(())
    }
    fn remove_car(env: &Env, owner: Address) -> Result<(), Error> {
        let admin = read_admin(env)?;
        admin.require_auth();

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        remove_car(env, &owner);
        events::remove_car::car_removed(env, owner);
        Ok(())
    }
    fn payout_owner(env: &Env, owner: Address, amount: i128) -> Result<(), Error> {
        owner.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        let mut car = read_car(&env, &owner)?;

        // Owner can only withdraw when car is returned (Available)
        if car.car_status != CarStatus::Available {
            return Err(Error::CarAlreadyRented);
        }

        if amount > car.available_to_withdraw {
            return Err(Error::InsufficientBalance);
        }

        let mut contract_balance = read_contract_balance(&env);

        if amount > contract_balance {
            return Err(Error::BalanceNotAvailableForAmountRequested);
        }

        car.available_to_withdraw = car
            .available_to_withdraw
            .checked_sub(amount)
            .ok_or(Error::OverflowError)?;
        contract_balance = contract_balance
            .checked_sub(amount)
            .ok_or(Error::OverflowError)?;

        write_car(&env, &owner, &car);
        write_contract_balance(&env, &contract_balance);

        token_transfer(&env, &env.current_contract_address(), &owner, &amount)?;
        events::payout_owner::payout_owner(env, owner, amount);
        Ok(())
    }

    fn set_admin_commission(env: &Env, commission: i128) -> Result<(), Error> {
        let admin = read_admin(env)?;
        admin.require_auth();

        if commission < 0 {
            return Err(Error::AmountMustBePositive);
        }

        write_admin_commission(env, commission);
        Ok(())
    }

    fn withdraw_admin_commission(env: &Env, amount: i128) -> Result<(), Error> {
        let admin = read_admin(env)?;
        admin.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        let mut admin_available = read_admin_available_to_withdraw(env);

        if amount > admin_available {
            return Err(Error::InsufficientBalance);
        }

        let mut contract_balance = read_contract_balance(&env);

        if amount > contract_balance {
            return Err(Error::BalanceNotAvailableForAmountRequested);
        }

        admin_available = admin_available
            .checked_sub(amount)
            .ok_or(Error::OverflowError)?;
        contract_balance = contract_balance
            .checked_sub(amount)
            .ok_or(Error::OverflowError)?;

        write_admin_available_to_withdraw(env, admin_available);
        write_contract_balance(&env, &contract_balance);

        token_transfer(&env, &env.current_contract_address(), &admin, &amount)?;
        Ok(())
    }

    fn return_car(env: &Env, renter: Address, owner: Address) -> Result<(), Error> {
        renter.require_auth();

        if renter == owner {
            return Err(Error::SelfRentalNotAllowed);
        }

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        if !has_rental(env, &renter, &owner) {
            return Err(Error::RentalNotFound);
        }

        let mut car = read_car(env, &owner)?;

        if car.car_status != CarStatus::Rented {
            return Err(Error::RentalNotFound);
        }

        car.car_status = CarStatus::Available;

        write_car(env, &owner, &car);
        remove_rental(env, &renter, &owner);

        events::rental::car_returned(env, renter, owner);
        Ok(())
    }
}
