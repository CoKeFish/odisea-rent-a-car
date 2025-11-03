use soroban_sdk::{Address, Env};
use crate::storage::car::{has_car, read_car};
use crate::storage::types::car_status::CarStatus;

pub(crate) fn get_owner_available_to_withdraw(env: &Env, owner: &Address) -> i128 {
    // If car doesn't exist, return 0 (cannot withdraw)
    if !has_car(env, owner) {
        return 0;
    }

    // Try to read car, if fails return 0
    let car = match read_car(env, owner) {
        Ok(c) => c,
        Err(_) => return 0,
    };

    // Owner can only withdraw when car is returned (Available)
    if car.car_status != CarStatus::Available {
        return 0;
    }

    // Return the available amount to withdraw
    car.available_to_withdraw
}

