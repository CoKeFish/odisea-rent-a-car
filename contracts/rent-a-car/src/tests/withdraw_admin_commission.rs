use soroban_sdk::{testutils::Address as _, Address};
use soroban_sdk::testutils::{MockAuth, MockAuthInvoke};
use crate::{storage::{admin::read_admin_available_to_withdraw, contract_balance::read_contract_balance}, tests::config::contract::ContractTest};
use soroban_sdk::IntoVal;

#[test]
pub fn test_withdraw_admin_commission_successfully() {
    let ContractTest { env, contract, token, admin, .. } = ContractTest::setup();

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

    let initial_admin_available = env.as_contract(&contract.address, || {
        read_admin_available_to_withdraw(&env)
    });
    assert_eq!(initial_admin_available, commission);

    let initial_contract_balance = env.as_contract(&contract.address, || {
        read_contract_balance(&env)
    });

    contract
        .mock_auths(&[MockAuth {
            address: &admin,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "withdraw_admin_commission",
                args: (withdraw_amount,).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .withdraw_admin_commission(&withdraw_amount);

    let updated_admin_available = env.as_contract(&contract.address, || {
        read_admin_available_to_withdraw(&env)
    });
    assert_eq!(updated_admin_available, commission - withdraw_amount);

    let updated_contract_balance = env.as_contract(&contract.address, || {
        read_contract_balance(&env)
    });
    assert_eq!(updated_contract_balance, initial_contract_balance - withdraw_amount);
}

#[test]
pub fn test_withdraw_admin_commission_full_amount() {
    let ContractTest { env, contract, token, admin, .. } = ContractTest::setup();

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
    contract.rental(&renter, &owner, &total_days, &amount);

    contract
        .mock_auths(&[MockAuth {
            address: &admin,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "withdraw_admin_commission",
                args: (commission,).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .withdraw_admin_commission(&commission);

    let updated_admin_available = env.as_contract(&contract.address, || {
        read_admin_available_to_withdraw(&env)
    });
    assert_eq!(updated_admin_available, 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
pub fn test_withdraw_admin_commission_with_zero_amount_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let amount = 0_i128;

    env.mock_all_auths();

    contract.withdraw_admin_commission(&amount);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
pub fn test_withdraw_admin_commission_with_negative_amount_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let amount = -100_i128;

    env.mock_all_auths();

    contract.withdraw_admin_commission(&amount);
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")]
pub fn test_withdraw_admin_commission_insufficient_balance_fails() {
    let ContractTest { contract, env, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    let commission = 500_i128;
    let withdraw_amount = 1000_i128; // More than available

    env.mock_all_auths();

    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.set_admin_commission(&commission);
    contract.rental(&renter, &owner, &total_days, &amount);

    contract.withdraw_admin_commission(&withdraw_amount);
}

#[test]
pub fn test_withdraw_admin_commission_multiple_rentals() {
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

    let total_commissions = commission * 2;
    let admin_available = env.as_contract(&contract.address, || {
        read_admin_available_to_withdraw(&env)
    });
    assert_eq!(admin_available, total_commissions);

    let withdraw_amount = 750_i128;
    contract.withdraw_admin_commission(&withdraw_amount);

    let updated_admin_available = env.as_contract(&contract.address, || {
        read_admin_available_to_withdraw(&env)
    });
    assert_eq!(updated_admin_available, total_commissions - withdraw_amount);
}

#[test]
pub fn test_withdraw_admin_commission_using_getter() {
    let ContractTest { env, contract, token, admin, .. } = ContractTest::setup();

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

    let initial_admin_available = contract.get_admin_available_to_withdraw();
    assert_eq!(initial_admin_available, commission, 
        "Expected initial available commission to be {}", commission);

    contract
        .mock_auths(&[MockAuth {
            address: &admin,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "withdraw_admin_commission",
                args: (withdraw_amount,).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .withdraw_admin_commission(&withdraw_amount);

    let updated_admin_available = contract.get_admin_available_to_withdraw();
    assert_eq!(updated_admin_available, commission - withdraw_amount,
        "Expected updated available commission to be {} after withdrawing {}", 
        commission - withdraw_amount, withdraw_amount);
    assert_eq!(updated_admin_available, initial_admin_available - withdraw_amount,
        "Available commission should decrease by the withdrawn amount");
}

