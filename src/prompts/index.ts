import type { McpPrompt } from '../types.js'
import { marketPrompts }      from './market.js'
import { transactionPrompts } from './transactions.js'
import { walletPrompts }      from './wallet.js'
import { dexPrompts }         from './dex.js'
import { planningPrompts }    from './planning.js'
import { developerPrompts }   from './developer.js'
import { onboardingPrompts }  from './onboarding.js'
import { paymentPrompts }     from './payments.js'
import { simulationPrompts }  from './simulation.js'
import { monitoringPrompts }  from './monitoring.js'

export const ALL_PROMPTS: McpPrompt[] = [
  ...marketPrompts,
  ...transactionPrompts,
  ...walletPrompts,
  ...dexPrompts,
  ...planningPrompts,
  ...developerPrompts,
  ...onboardingPrompts,
  ...paymentPrompts,
  ...simulationPrompts,
  ...monitoringPrompts,
]
