use soroban_sdk::{Address, Env, Symbol};

pub(crate) fn rented(
    env: &Env,
    renter: Address,
    owner: Address,
    total_days: u32,
    amount: i128
) {
    let topics = (Symbol::new(env, "rented"), renter.clone(), owner.clone());

    env.events().publish(
        topics,
        (total_days, amount)
    );
}

pub(crate) fn car_returned(
    env: &Env,
    renter: Address,
    owner: Address
) {
    let topics = (Symbol::new(env, "car_returned"), renter.clone(), owner.clone());

    env.events().publish(topics, ());
}