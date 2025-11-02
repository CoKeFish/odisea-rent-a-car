use soroban_sdk::{testutils::Address as _, Address, IntoVal};
use soroban_sdk::testutils::{MockAuth, MockAuthInvoke};
use crate::tests::config::contract::ContractTest;

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
    contract
        .mock_auths(&[MockAuth {
            address: &unauthorized,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "return_car",
                args: (unauthorized.clone(), owner.clone()).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .return_car(&unauthorized, &owner);
}

