use soroban_sdk::{testutils::Address as _, Address};
use crate::tests::config::contract::ContractTest;

#[test]
pub fn test_get_admin_available_to_withdraw_default_zero() {
    let ContractTest { contract, .. } = ContractTest::setup();

    let available = contract.get_admin_available_to_withdraw();
    assert_eq!(available, 0);
}

#[test]
pub fn test_get_admin_available_to_withdraw_after_rental() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    let commission = 500_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.set_admin_commission(&commission);

    // Before rental, available should be 0
    let available = contract.get_admin_available_to_withdraw();
    assert_eq!(available, 0);

    // After rental, commission should be available
    contract.rental(&renter, &owner, &total_days, &amount);

    let available = contract.get_admin_available_to_withdraw();
    assert_eq!(available, commission);
}

#[test]
pub fn test_get_admin_available_to_withdraw_after_multiple_rentals() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    let renter1 = Address::generate(&env);
    let renter2 = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount1 = 4500_i128;
    let amount2 = 3000_i128;
    let commission = 500_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter1, &amount_mint);
    token_admin.mint(&renter2, &amount_mint);

    contract.add_car(&owner1, &price_per_day);
    contract.add_car(&owner2, &price_per_day);
    contract.set_admin_commission(&commission);

    contract.rental(&renter1, &owner1, &total_days, &amount1);
    contract.rental(&renter2, &owner2, &total_days, &amount2);

    let available = contract.get_admin_available_to_withdraw();
    assert_eq!(available, commission * 2);
}

#[test]
pub fn test_get_admin_available_to_withdraw_after_withdraw() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    let commission = 500_i128;
    let withdraw_amount = 300_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.set_admin_commission(&commission);
    contract.rental(&renter, &owner, &total_days, &amount);

    let available_before = contract.get_admin_available_to_withdraw();
    assert_eq!(available_before, commission);

    contract.withdraw_admin_commission(&withdraw_amount);

    let available_after = contract.get_admin_available_to_withdraw();
    assert_eq!(available_after, commission - withdraw_amount);
}

