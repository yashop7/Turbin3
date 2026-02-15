use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", voter.key().as_ref(), proposal.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(
        token::authority = voter
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

impl<'info> CastVote<'info> {
    pub fn cast(&mut self, vote_credits: u64, vote_type: u8, bumps: CastVoteBumps) -> Result<()> {
        self.vote.set_inner(Vote {
            authority: self.voter.key(),
            vote_credits,
            vote_type,
            bump: bumps.vote,
        });

        if vote_type == 1 {
            self.proposal.yes_vote_count += vote_credits;
        } else {
            self.proposal.no_vote_count += vote_credits;
        }

        Ok(())
    }
}

pub fn cast_vote(ctx: Context<CastVote>, vote_type: u8) -> Result<()> {
    let vote_credits = (ctx.accounts.creator_token_account.amount as f64).sqrt() as u64;

    ctx.accounts.cast(vote_credits, vote_type, ctx.bumps)?;

    Ok(())
}
