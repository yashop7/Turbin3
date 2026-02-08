use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
// use constant_product_curve::{ConstantProduct, LiquidityPair};

use crate::{errors::AmmError, state::Config};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"config",config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"lp", config.key().as_ref()],
        bump = config.lp_bump,
    )]
    pub mint_lp: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = config,
    )]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = config,
    )]
    pub vault_y: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = user,
    )]
    pub user_x: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = user,
    )]
    pub user_y: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Swap<'info> {
    pub fn swap(&mut self, is_x: bool, amount: u64, min: u64) -> Result<()> {
        require!(self.config.locked == false, AmmError::PoolLocked);
        require!(amount != 0, AmmError::InvalidAmount);

        let fee = amount
            .checked_mul(self.config.fee as u64)
            .ok_or(AmmError::Overflow)?
            .checked_div(10000)
            .ok_or(AmmError::Overflow)?;

        let amount_after_fee = amount.checked_sub(fee).ok_or(AmmError::Overflow)?;

        // balance before swap
        let x_before = self.vault_x.amount;
        let y_before = self.vault_y.amount;
        let product = x_before.checked_mul(y_before).ok_or(AmmError::Overflow)?;

        // focus_token_before => token user depositing
        let (focus_token_before, other_token_before) = match is_x {
            true => (x_before, y_before),
            false => (y_before, x_before),
        };

        let focus_token_after = focus_token_before
            .checked_add(amount_after_fee)
            .ok_or(AmmError::Overflow)?;

        let other_token_after = product.checked_div(focus_token_after).ok_or(AmmError::Overflow)?;

        // other token user will receive for the focus token
        let amount_out = other_token_before
            .checked_sub(other_token_after)
            .ok_or(AmmError::Overflow)?;

        require!(amount_out >= min, AmmError::SlippageExceeded);

        self.deposit_tokens(is_x, amount)?;
        self.withdraw_tokens(is_x, amount_out)?;

        Ok(())
    }

    pub fn deposit_tokens(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (
                self.user_x.to_account_info(),
                self.vault_x.to_account_info(),
            ),
            false => (
                self.user_y.to_account_info(),
                self.vault_y.to_account_info(),
            ),
        };

        transfer(
            CpiContext::new(
                self.token_program.to_account_info(),
                Transfer {
                    from,
                    to,
                    authority: self.user.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn withdraw_tokens(&mut self, is_x: bool, amount: u64) -> Result<()> {
        // Withdraw from the opposite vault (other kind of token)
        let (from, to) = match is_x {
            true => (
                self.vault_y.to_account_info(),
                self.user_y.to_account_info(),
            ),
            false => (
                self.vault_x.to_account_info(),
                self.user_x.to_account_info(),
            ),
        };

        transfer(
            CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            Transfer {
                from,
                to,
                authority: self.config.to_account_info(),
            },
            &[&[
                b"config".as_ref(),
                &self.config.seed.to_le_bytes(),
                &[self.config.config_bump],
            ]],
            ),
            amount,
        )?;

        Ok(())
    }
}
