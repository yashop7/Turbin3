use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitDao<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Dao::INIT_SPACE,
        seeds = [b"dao",creator.key().as_ref(),name.as_bytes()],
        bump
    )]
    pub dao: Account<'info, Dao>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitDao<'info> {
    pub fn init(&mut self, name: String, authority: Pubkey, bump: InitDaoBumps) {
        self.dao.set_inner(Dao {
            name,
            authority,
            proposal_count: 0,
            bump: bump.dao
        });
    }
}

pub fn init_dao(ctx: Context<InitDao>, name: String) -> Result<()> {
    ctx.accounts.init(name, ctx.accounts.creator.key(),ctx.bumps);
    Ok(())
}
