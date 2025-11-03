use soroban_sdk::{testutils::Address as _, Address};
use crate::tests::config::contract::ContractTest;

#[test]
pub fn test_get_owner_available_to_withdraw_car_not_found() {
    let ContractTest { contract, env, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    
    // Should return 0 when car doesn't exist
    let available = contract.get_owner_available_to_withdraw(&owner);
    assert_eq!(available, 0);
}

#[test]
pub fn test_get_owner_available_to_withdraw_car_rented() {
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

    // Should return 0 when car is rented
    let available = contract.get_owner_available_to_withdraw(&owner);
    assert_eq!(available, 0, "Should return 0 when car is rented");
}

#[test]
pub fn test_get_owner_available_to_withdraw_car_available_no_funds() {
    let ContractTest { contract, env, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    env.mock_all_auths();

    contract.add_car(&owner, &price_per_day);

    // Should return 0 when car is available but has no funds
    let available = contract.get_owner_available_to_withdraw(&owner);
    assert_eq!(available, 0, "Should return 0 when no funds available");
}

#[test]
pub fn test_get_owner_available_to_withdraw_car_available_with_funds() {
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
    
    // Return the car first
    contract.return_car(&renter, &owner);

    // Should return the available amount when car is available and has funds
    let available = contract.get_owner_available_to_withdraw(&owner);
    assert_eq!(available, amount, "Should return the available amount when car is returned");
}

#[test]
pub fn test_get_owner_available_to_withdraw_after_partial_withdraw() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    let withdraw_amount = 2000_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.rental(&renter, &owner, &total_days, &amount);
    contract.return_car(&renter, &owner);

    // Check available before withdrawal
    let available_before = contract.get_owner_available_to_withdraw(&owner);
    assert_eq!(available_before, amount);

    // Withdraw partial amount
    contract.payout_owner(&owner, &withdraw_amount);

    // Check available after withdrawal
    let available_after = contract.get_owner_available_to_withdraw(&owner);
    assert_eq!(available_after, amount - withdraw_amount, 
        "Should return remaining amount after partial withdrawal");
}

#[test]
pub fn test_get_owner_available_to_withdraw_multiple_rentals() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter1 = Address::generate(&env);
    let renter2 = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days1 = 3;
    let total_days2 = 2;
    let amount1 = 4500_i128;
    let amount2 = 3000_i128;

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter1, &amount_mint);
    token_admin.mint(&renter2, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    
    // First rental
    contract.rental(&renter1, &owner, &total_days1, &amount1);
    contract.return_car(&renter1, &owner);

    // Second rental
    contract.rental(&renter2, &owner, &total_days2, &amount2);
    contract.return_car(&renter2, &owner);

    // Should return total accumulated funds
    let available = contract.get_owner_available_to_withdraw(&owner);
    assert_eq!(available, amount1 + amount2, 
        "Should return total accumulated funds from multiple rentals");
}

