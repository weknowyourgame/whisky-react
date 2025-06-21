import * as SplToken from '@solana/spl-token'
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { createReferral } from './program'

export interface WhiskyPlugin {
  (input: any, context: any): Promise<TransactionInstruction[]>
}

export const makeReferralPlugin = (
  recipient: PublicKey,
  upsert: boolean,
  referralFee = 0.01,
  creatorFeeDeduction = 1,
): WhiskyPlugin => async (input, context) => {
  const instructions: TransactionInstruction[] = []
  const tokenAmount = BigInt(Math.floor(input.wager * referralFee))

  if (upsert) {
    // Save the referral address on-chain
    instructions.push(
      await createReferral(context.provider.anchorProvider!, input.creator, recipient),
    )
  }

  // Send native SOL
  if (input.token.equals(SplToken.NATIVE_MINT)) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: input.wallet,
        toPubkey: recipient,
        lamports: tokenAmount,
      }),
    )
  } else {
    // Send SPL token
    const fromAta = SplToken.getAssociatedTokenAddressSync(input.token, input.wallet)
    const toAta = SplToken.getAssociatedTokenAddressSync(input.token, recipient)

    const recipientHasAta = await (async () => {
      try {
        await SplToken.getAccount(context.provider.anchorProvider.connection, toAta, 'confirmed')
        // Recipient account exists, return empty
        return true
      } catch (error) {
        if (error instanceof SplToken.TokenAccountNotFoundError || error instanceof SplToken.TokenInvalidAccountOwnerError) {
          // Recipient account doesn't exist, add create instruction
          return false
        } else {
          throw error
        }
      }
    })()

    if (!recipientHasAta) {
      instructions.push(
        SplToken.createAssociatedTokenAccountInstruction(
          input.wallet,
          toAta,
          recipient,
          input.token,
        ),
      )
    }

    instructions.push(
      SplToken.createTransferInstruction(
        fromAta,
        toAta,
        input.wallet,
        tokenAmount,
      ),
    )
  }

  // Override creatorFee so that the player doesn't end up paying more
  context.creatorFee = Math.max(0, context.creatorFee - referralFee * creatorFeeDeduction)

  return instructions
}
