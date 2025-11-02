use soroban_sdk::{testutils::Address as _, vec, Address, IntoVal, Symbol};
use crate::{storage::{car::read_car, rental::has_rental}, storage::types::car_status::CarStatus, tests::config::contract::ContractTest};
use crate::tests::config::utils::get_contract_events;

#[test]
pub fn test_return_car_successfully() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.rental(&renter, &owner, &total_days, &amount);

    // Verify car is rented
    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.car_status, CarStatus::Rented);

    // Verify rental exists
    let rental_exists = env.as_contract(&contract.address, || {
        has_rental(&env, &renter, &owner)
    });
    assert_eq!(rental_exists, true);

    // Return the car
    contract.return_car(&renter, &owner);
    let contract_events = get_contract_events(&env, &contract.address);

    // Verify car is available again
    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.car_status, CarStatus::Available);

    // Verify rental is removed
    let rental_exists = env.as_contract(&contract.address, || {
        has_rental(&env, &renter, &owner)
    });
    assert_eq!(rental_exists, false);

    // Verify event
    assert_eq!(
        contract_events,
        vec![
            &env,
            (
                contract.address.clone(),
                vec![
                    &env,
                    *Symbol::new(&env, "car_returned").as_val(),
                    renter.clone().into_val(&env),
                    owner.clone().into_val(&env),
                ],
                ().into_val(&env)
            )
        ]
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
pub fn test_return_car_without_rental_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);

    env.mock_all_auths();

    // Try to return a car that doesn't exist (will fail with CarNotFound)
    contract.return_car(&renter, &owner);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
pub fn test_return_car_when_car_not_rented_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;

    env.mock_all_auths();

    contract.add_car(&owner, &price_per_day);

    // Try to return a car that is available, not rented (no rental exists)
    contract.return_car(&renter, &owner);
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")]
pub fn test_return_car_self_return_fails() {
    let ContractTest { contract, env, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&owner, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.rental(&owner, &owner, &total_days, &amount);

    // Owner tries to return their own car (should fail at rental, but test here too)
    contract.return_car(&owner, &owner);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
pub fn test_unauthorized_user_cannot_return_car() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.rental(&renter, &owner, &total_days, &amount);

    // Unauthorized user tries to return the car (will fail because no rental exists for unauthorized)
    contract.return_car(&unauthorized, &owner);
}

#[test]
pub fn test_return_car_multiple_rentals_and_returns() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter1 = Address::generate(&env);
    let renter2 = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter1, &amount_mint);
    token_admin.mint(&renter2, &amount_mint);

    contract.add_car(&owner, &price_per_day);

    // First rental
    contract.rental(&renter1, &owner, &total_days, &amount);
    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.car_status, CarStatus::Rented);

    // Return car
    contract.return_car(&renter1, &owner);
    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.car_status, CarStatus::Available);

    // Second rental
    contract.rental(&renter2, &owner, &total_days, &amount);
    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.car_status, CarStatus::Rented);

    // Return car again
    contract.return_car(&renter2, &owner);
    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.car_status, CarStatus::Available);
}

