use crate::{state::Proposal, Dao};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitProposal<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", dao.key().as_ref(), dao.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub dao: Account<'info, Dao>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitProposal<'info> {
    pub fn init(&mut self, metadata: String, bump: InitProposalBumps) -> Result<()> {
        self.proposal.set_inner(Proposal {
            authority: self.creator.key(),
            metadata,
            yes_vote_count: 0,
            no_vote_count: 0,
            bump: bump.proposal,
        });
        
        self.dao.proposal_count += 1;
        
        Ok(())
    }
}

pub fn init_proposal(ctx : Context<InitProposal>, metadata: String ) -> Result<()> {
    ctx.accounts.init(metadata, ctx.bumps)?;
    Ok(())
}
