import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useContext, useMemo } from 'react'
import { useWhiskyPlatformContext } from '../hooks'
import { useWhisky } from '../hooks/useWhisky'
import { closeReferral, createReferral } from './program'
import { ReferralContext } from './ReferralContext'
import { getReferralLink } from './referralUtils'

function useWhiskyProvider() {
  const { provider } = useWhisky()
  return { anchorProvider: provider?.anchorProvider }
}

function useSendTransaction() {
  return async (transaction: any, options?: any) => {
    // This would need to be implemented with the actual transaction sending logic
    console.warn('useSendTransaction not implemented yet')
    return 'fake-tx-id'
  }
}

export function useReferral() {
  const { clearCache, setCache, isOnChain, referrerAddress, referralStatus, prefix } = useContext(ReferralContext)
  const wallet = useWallet()
  const platform = useWhiskyPlatformContext()
  const provider = useWhiskyProvider()
  const sendTransaction = useSendTransaction()
  const referralLink = useMemo(() => wallet.publicKey && getReferralLink(prefix, wallet.publicKey), [prefix, wallet.publicKey?.toString()])

  const copyLinkToClipboard = () => {
    if (!wallet.publicKey) {
      throw new Error('NOT_CONNECTED')
    }
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
    }
  }

  const removeInvite = async (options?: any) => {
    if (!provider.anchorProvider) {
      throw new Error('Provider not available')
    }
    const txId = await sendTransaction(
      closeReferral(
        provider.anchorProvider,
        platform.platform.creator,
      ),
      { confirmation: 'confirmed', ...options },
    )
    clearCache()
    return txId
  }

  const acceptInvite = async (address: PublicKey, options?: any) => {
    if (!provider.anchorProvider) {
      throw new Error('Provider not available')
    }
    const txId = await sendTransaction(
      createReferral(
        provider.anchorProvider,
        platform.platform.creator,
        address,
      ),
      { confirmation: 'confirmed', ...options },
    )

    setCache(address, true)

    return txId
  }

  const acceptInviteOnNextPlay = async (address: PublicKey) => {
    setCache(address, false)
  }

  return {
    /** Accepts the invite on-chain. Requires a signature from the user. You can also use `acceptInviteOnNextPlay`. */
    acceptInvite,
    /** Removes the invite on-chain and cache. */
    removeInvite,
    /** Clears the local cache. */
    clearCache,
    /**
     * Stores the invite locally until the next play, at which point it will be upserted on-chain.
     * @note If the user has already accepted an invite on-chain, the local invite will be ignored and must be removed with `removeInvite`.
     * */
    acceptInviteOnNextPlay,
    /** Copies the users invite code to clipboard */
    copyLinkToClipboard,
    /** The address which referred the connected user */
    referrerAddress,
    /** Whether on not the connected user has been accepted the invite on-chain */
    isOnChain,
    referralStatus,
    referralLink,
  }
}
