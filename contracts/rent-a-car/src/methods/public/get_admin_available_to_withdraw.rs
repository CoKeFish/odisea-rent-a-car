use soroban_sdk::Env;
use crate::storage::admin::read_admin_available_to_withdraw;

pub(crate) fn get_admin_available_to_withdraw(env: &Env) -> i128 {
    read_admin_available_to_withdraw(env)
}

