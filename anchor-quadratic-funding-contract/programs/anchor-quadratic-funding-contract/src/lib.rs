use anchor_lang::prelude::*;

pub mod state;
pub use state::*;

pub mod instructions;
pub use instructions::*;


declare_id!("DkHmV9vDdCJSW6c5jTN5iBNn9VkFMPpRJ5B8UgcHeHMX");


#[program]
pub mod anchor_quadratic_funding_contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
