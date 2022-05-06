import { useState } from 'react'
import './App.scss'
import { ethers } from 'ethers'
import {
  ARGENT_GUARDIAN_MANAGER_ADDRESS,
  ARGENT_WALLET_DETECTOR_ADDRESS,
  DEFAULT_ERC20_ADDRESSES,
} from '../constants/addresses'
import WALLET_DETECTOR_ABI from '../abis/argent-wallet-detector.json'
import GUARDIAN_MANAGER_ABI from '../abis/argent-guardian-manager.json'
import ERC20_ABI from '../abis/erc20.json'
import { ERC20_ADDRESSES_STORAGE_KEY } from '../constants/storage'

type AccountInfo = {
  isArgentWallet: boolean
  ethBalance: string
  guardianCount: number
  erc20Tokens: {
    symbol: string
    balance: string
  }[]
}

function App() {
  const [isLoading, setLoading] = useState(false)
  const [info, setInfo] = useState<AccountInfo | null>(null)

  return (
    <main className="App">
      <section className="wallet-address">
        <h5>Enter your wallet address:</h5>
        <form
          onSubmit={e => {
            e.preventDefault()
            loadWalletInfo((e.target as any).address.value)
          }}
        >
          <input type="text" name="address" placeholder="0x..." />
          <button type="submit"> {'>>>'} </button>
        </form>
      </section>

      {isLoading && <section className="loading">⏳ Loading...</section>}

      {info && (
        <section className="info">
          <div>
            <h5>
              Wallet Balance (
              {info.isArgentWallet ? (
                <span className="success">Argent Wallet 🔐</span>
              ) : (
                <span className="warning">Not Argent Wallet ⚠️</span>
              )}
              )
            </h5>
            <h2>{info.ethBalance} ETH</h2>
          </div>

          <div>
            <h5>Number of guardians</h5>
            <h2>{info.guardianCount}</h2>
          </div>

          <div className="erc20">
            <h5>ERC20 tokens</h5>
            {info.erc20Tokens.map((x, i) => (
              <h2 key={i}>
                <span className="symbol">{x.symbol}</span> {x.balance}
              </h2>
            ))}
          </div>
        </section>
      )}
    </main>
  )

  async function loadWalletInfo(address: string) {
    setInfo(null)
    setLoading(true)

    try {
      // verify address checksum
      const verifiedAddress = ethers.utils.getAddress(address)

      // create provider (via Infura)
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_INFURA_URL,
      )

      const balance = await provider.getBalance(verifiedAddress)
      const ethBalance = ethers.utils.formatEther(balance)

      // wallet detection call
      const walletDetectorContract = new ethers.Contract(
        ARGENT_WALLET_DETECTOR_ADDRESS,
        WALLET_DETECTOR_ABI,
      ).connect(provider)

      const isArgentWallet = await walletDetectorContract.isArgentWallet(
        verifiedAddress,
      )

      // guardians count call
      const guardianManagerContract = new ethers.Contract(
        ARGENT_GUARDIAN_MANAGER_ADDRESS,
        GUARDIAN_MANAGER_ABI,
      ).connect(provider)

      const guardianCount = await guardianManagerContract.guardianCount(
        verifiedAddress,
      )

      // ERC20 token balances
      const erc20Addresses = getERC20Addresses()

      const erc20Tokens = await Promise.all(
        erc20Addresses.map(erc20Address =>
          loadERC20Balance(provider, erc20Address, verifiedAddress),
        ),
      )

      setInfo({
        ethBalance,
        guardianCount: guardianCount.toNumber(),
        isArgentWallet,
        erc20Tokens,
      })
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message)
      }

      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadERC20Balance(
    provider: ethers.providers.Provider,
    erc20Address: string,
    verifiedAddress: string,
  ) {
    const erc20Contract = new ethers.Contract(erc20Address, ERC20_ABI).connect(
      provider,
    )

    const symbol = await erc20Contract.symbol()
    const decimals = await erc20Contract.decimals()
    const balance = await erc20Contract.balanceOf(verifiedAddress)

    return {
      symbol,
      balance: ethers.utils.formatUnits(balance, decimals),
    }
  }

  function getERC20Addresses() {
    let savedERC20Addresses = localStorage
      .getItem(ERC20_ADDRESSES_STORAGE_KEY)
      ?.split(',')

    if (!savedERC20Addresses) {
      savedERC20Addresses = DEFAULT_ERC20_ADDRESSES

      localStorage.setItem(
        ERC20_ADDRESSES_STORAGE_KEY,
        savedERC20Addresses.join(','),
      )
    }

    return savedERC20Addresses
  }
}

export default App
