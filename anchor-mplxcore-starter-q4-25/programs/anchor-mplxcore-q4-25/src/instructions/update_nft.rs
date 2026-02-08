use anchor_lang::prelude::*;
use mpl_core::{
    instructions::UpdateV1CpiBuilder,
    ID as CORE_PROGRAM_ID,
};

use crate::{error::MPLXCoreError, state::CollectionAuthority};

#[derive(Accounts)]
pub struct UpdateNft<'info> {
    #[account(mut)]
    pub minter: Signer<'info>,
    #[account(
        mut,
        constraint = !asset.data_is_empty() @ MPLXCoreError::AssetNotInitialized
    )]
    /// CHECK: Verified by MPL Core
    pub asset: UncheckedAccount<'info>,
    #[account(
        constraint = collection.owner == &CORE_PROGRAM_ID @ MPLXCoreError::InvalidCollection,
        constraint = !collection.data_is_empty() @ MPLXCoreError::CollectionNotInitialized
    )]
    /// CHECK: Verified by MPL Core
    pub collection: UncheckedAccount<'info>,
    #[account(address = CORE_PROGRAM_ID)]
    /// CHECK: Verified by MPL Core
    pub core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> UpdateNft<'info> {
    pub fn update_nft(&mut self, new_name: String) -> Result<()> {
        UpdateV1CpiBuilder::new(&self.core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .collection(Some(&self.collection.to_account_info()))
            .payer(&self.minter.to_account_info())
            .authority(Some(&self.minter.to_account_info()))
            .system_program(&self.system_program.to_account_info())
            .new_name(new_name)
            .invoke()?;

        Ok(())
    }
}
