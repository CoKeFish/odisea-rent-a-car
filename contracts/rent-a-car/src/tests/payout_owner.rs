use crate::{
    storage::{car::read_car, contract_balance::read_contract_balance, types::car_status::CarStatus},
    tests::config::{contract::ContractTest, utils::get_contract_events},
};
use soroban_sdk::{testutils::Address as _, vec, Address, IntoVal, Symbol};

#[test]
pub fn test_payout_owner_successfully() {
    let ContractTest {
        env,
        contract,
        token,
        ..
    } = ContractTest::setup();

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

    // Return the car before withdrawing
    contract.return_car(&renter, &owner);

    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, amount);

    contract.payout_owner(&owner, &amount);
    let contract_events = get_contract_events(&env, &contract.address);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.available_to_withdraw, 0);

    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, 0);
    assert_eq!(
        contract_events,
        vec![
            &env,
            (
                contract.address.clone(),
                vec![
                    &env,
                    *Symbol::new(&env, "payout").as_val(),
                    owner.clone().into_val(&env),
                ],
                amount.into_val(&env)
            )
        ]
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")]
pub fn test_payout_owner_when_car_is_rented_fails() {
    let ContractTest {
        env,
        contract,
        token,
        ..
    } = ContractTest::setup();

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

    // Try to withdraw while car is still rented (should fail)
    contract.payout_owner(&owner, &amount);
}

#[test]
pub fn test_payout_owner_after_return_car_successfully() {
    let ContractTest {
        env,
        contract,
        token,
        ..
    } = ContractTest::setup();

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

    // Try to withdraw while rented (should fail)
    // This is tested separately, so we'll just return the car
    contract.return_car(&renter, &owner);

    // Verify car is now available
    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.car_status, CarStatus::Available);

    // Now withdrawal should succeed
    contract.payout_owner(&owner, &amount);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner)).unwrap();
    assert_eq!(car.available_to_withdraw, 0);
}
