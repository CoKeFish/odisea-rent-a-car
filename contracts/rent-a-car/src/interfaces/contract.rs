use soroban_sdk::{Address, Env};

use crate::storage::types::{car_status::CarStatus, errors::Error};

pub trait RentACarContractTrait {
    fn __constructor(env: &Env, admin: Address, token: Address) -> Result<(), Error>;
    fn add_car(env: &Env, owner: Address, price_per_day: i128) -> Result<(), Error>;
    fn get_car_status(env: &Env, owener: Address) -> Result<CarStatus, Error>;
    fn rental(
        env: &Env,
        renter: Address,
        car_owner: Address,
        total_days_to_rent: u32,
        amount: i128,
    ) -> Result<(), Error>;
    fn remove_car(env: &Env, owner: Address) -> Result<(), Error>;
    fn payout_owner(env: &Env, owner: Address, amount: i128) -> Result<(), Error>;
    fn set_admin_commission(env: &Env, commission: i128) -> Result<(), Error>;
    fn withdraw_admin_commission(env: &Env, amount: i128) -> Result<(), Error>;
    fn get_admin_available_to_withdraw(env: &Env) -> i128;
    fn return_car(env: &Env, renter: Address, owner: Address) -> Result<(), Error>;
}
