import { Email, ExtractedFeatures, ModelMetrics, WordFeatureWeight, PredictionResult } from '../types';

// Stop words we exclude from tokenization to reduce noise (generic words that carry no structural meaning)
const STOP_WORDS = new Set([
  'the', 'and', 'a', 'is', 'of', 'to', 'in', 'it', 'that', 'this', 'for', 'on', 'with', 'as', 'at', 'by', 'an', 'be', 'are', 'was'
]);

// Curated list of high-urgency keywords often found in phishing attempts
const URGENCY_KEYWORDS = [
  'verify', 'verification', 'suspended', 'suspend', 'immediate', 'immediately', 'action required',
  'urgent', 'urgently', 'blocked', 'block', 'security team', 'reset your password', 'security notice',
  'unauthorized', 'credentials', 'bank account', 'credit card', 'invoice', 'overdue', 'pay now',
  'victim', 'refund', 'claim', 'compromised', 'restrict', 'restricted', 'login link', 'update now'
];

export const INITIAL_EMAILS: Email[] = [
  {
    id: 'phish-1',
    subject: 'Your PayPal Account has been Suspended!',
    sender: 'security@paypal-verification-secure-lock.com',
    body: 'Dear Customer, We detected suspicious login attempts on your PayPal account. Verify your banking credentials immediately within 24 hours, or your secure account will be permanently blocked. Click here to login and verify: http://paypal-secure-update-login.com/security/webscr. Failure to act now will restrict access.',
    label: 'phishing'
  },
  {
    id: 'phish-2',
    subject: 'URGENT: Billing method declined - Account suspended',
    sender: 'support@netflix-billing-renew-account.net',
    body: 'Your Netflix monthly membership fee could not be processed. Update payment details now to avoid service interruption: http://netflix-billing-renew-account.net/login. Please verify credit card credentials and invoice payment within 12 hours. Credit cards must be verified or account termination occurs.',
    label: 'phishing'
  },
  {
    id: 'phish-3',
    subject: 'Action Required: Office 365 Password Expiring Today',
    sender: 'admin@login.microsoftonline.secured-signon.com',
    body: 'Microsoft Security Team Alert. Your Office 365 work password expires in 3 hours. Reset password immediately using the link below to preserve your email archives and secure records: http://login.microsoftonline.secured-signon.com/reset/auth. Confirm details or access will lock.',
    label: 'phishing'
  },
  {
    id: 'phish-4',
    subject: 'Action Required: Security Alert - Suspicious Login Blocked',
    sender: 'no-reply@accounts.google-safesecure-verify.cz',
    body: 'Someone recently tried to access your Google Mail account from an unrecognized IP address (192.168.22.41) in Russia. If this was not you, please verify your credentials and secure login identity immediately by clicking: http://google.com.safesecure-verify.cz/accounts. Security team requires prompt actions.',
    label: 'phishing'
  },
  {
    id: 'phish-5',
    subject: 'URGENT: Direct Deposit Details Verification',
    sender: 'payroll@employee-payroll-direct-portal-verify.org',
    body: 'Employee Portal Support Notice. We are transitioning to a new payroll system and require all employees to verify their direct deposit banking credentials before the end of the week. Failure to update bank routing numbers will delay your paycheck. Confirm credentials at: http://employee-payroll-direct-portal-verify.org/login?id=98',
    label: 'phishing'
  },
  {
    id: 'phish-6',
    subject: 'Congratulations! You received 0.54 BTC!',
    sender: 'promo-draw@blockchain-rewards-claim.xyz',
    body: 'You have been selected as the winner of our weekly promo draw! Your secure crypto wallet receives 0.54 Bitcoin. Verify your credentials, complete the verification of security keys, and claim your money reward immediately at: http://blockchain-rewards-claim.xyz/redeem-btc. Act now!',
    label: 'phishing'
  },
  {
    id: 'phish-7',
    subject: 'Suspicious Action: Amazon Order Terminated',
    sender: 'unauthorized-charges@amazon-auth-check-info.cc',
    body: 'Dear Amazon buyer, we noticed an unauthorized transaction on your account. To protect your identity, we suspended your account. Click this form link to confirm billing information or get locked out forever: http://amazon-auth-check-info.cc/status. Confirm details immediately.',
    label: 'phishing'
  },
  {
    id: 'phish-8',
    subject: 'Immediate Payment Request: Overdue Invoice #9838',
    sender: 'collections@payment-billing-invoice-portal.net',
    body: 'Dear customer, your unpaid invoice is now 15 days overdue. Please make immediate invoice payment. Failure to pay will result in collection efforts and credit credentials suspended. Download invoice and pay at http://payment-billing-invoice-portal.net/invoice/98381',
    label: 'phishing'
  },
  {
    id: 'safe-1',
    subject: 'Team Lunch this Friday!',
    sender: 'sarah.connor@office-workspace.com',
    body: 'Hey team, we are planning a casual lunch this Friday around 12:30 PM. We will probably head to the Italian place down the street. Let me know if you are coming and any dietary restrictions you have by Thursday. Best, Sarah.',
    label: 'safe'
  },
  {
    id: 'safe-2',
    subject: 'Weekly Status & Roadmap Progress Update',
    sender: 'john.smith@office-workspace.com',
    body: 'Hello all, please find attached the weekly roadmap progress report for our team project. Overall tasks are on track. Thanks to everyone for the hard work on the deployment. Let me know if you have any questions on the attached documentation files.',
    label: 'safe'
  },
  {
    id: 'safe-3',
    subject: 'Payment confirmation for your Gym Monthly Membership',
    sender: 'info@fit-life-gym.com',
    body: 'Hi Alex, hope you are having a great week. This email is to confirm your recent monthly automated payment checkout of $45.00. No further actions are needed. Thank you for your continued membership. Contact support if you need any assistance.',
    label: 'safe'
  },
  {
    id: 'safe-4',
    subject: 'PR #142 Merged: Fix navigation responsive layout',
    sender: 'github-updates@github.office-workspace.com',
    body: 'The pull request to fix mobile menu styling on the main page has been successfully merged by Sarah. Code builds perfectly and tests passed. Let\'s do a quick post-deployment review during tomorrow\'s morning standup meeting.',
    label: 'safe'
  },
  {
    id: 'safe-5',
    subject: 'Out of Office: vacation next week',
    sender: 'mark.t@office-workspace.com',
    body: 'Hi team, I will be out of office on vacation next week from Monday to Friday. I will have limited access to emails but you can message Sarah if there are urgent project matters that cannot wait. Check the shared calendar spreadsheet. Cheers, Mark.',
    label: 'safe'
  },
  {
    id: 'safe-6',
    subject: 'Book return reminder - Public Library',
    sender: 'no-reply@city-pl-library.org',
    body: 'This is a courtesy reminder from the public library metadata system. The book titled "The Pragmatic Programmer" is due back by Thursday. There are currently no fines, but please return it on time so other readers can enjoy it. Thank you.',
    label: 'safe'
  },
  {
    id: 'safe-7',
    subject: 'Feedback on the new application design draft',
    sender: 'emma.designer@office-workspace.com',
    body: 'Hi team, here is the draft mockup of the redesigned home dashboard. Please take a look at the typography pairings and visual spacing. I would appreciate your comments on negative space and layout before we implement. Let\'s chat tomorrow.',
    label: 'safe'
  },
  {
    id: 'safe-8',
    subject: 'Monthly Company Newsletter & News',
    sender: 'hr-announcements@office-workspace.com',
    body: 'Dear colleagues, our monthly company newsletter is here. We had a record quarter and welcomed 5 new teammates! Read more about company news, recent product updates, and Sarah\'s upcoming book club on the employee intranet portal.',
    label: 'safe'
  }
];

/**
 * Normalizes text: lowercase, removes non-alphabetic/numerical chars, tokenizes
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Rules-Engine: Extracts heuristic cybersecurity cues
 */
export function extractHeuristicFeatures(email: Email): ExtractedFeatures {
  const fullText = `${email.subject} ${email.body}`.toLowerCase();
  const senderLower = email.sender.toLowerCase();

  // Heuristic 1: Suspicious URLs
  // Check if text has pattern resembling http/https URL and does NOT belong to a highly trusted domain
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = fullText.match(urlRegex) || [];
  
  // Define phishing domain flags (weird TLDs, multiple subdomains, or highly specific text)
  const phishingTlds = ['.cc', '.xyz', '.net', '.cz', '.info', '.work', '.click', '.tk'];
  const trustedDomains = ['office-workspace.com', 'fit-life-gym.com', 'github.office-workspace.com', 'city-pl-library.org', 'google.com', 'paypal.com', 'netflix.com'];
  
  let hasSuspiciousUrls = false;
  if (urls.length > 0) {
    for (const url of urls) {
      // Check for raw IP address in URL
      if (/\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
        hasSuspiciousUrls = true;
        break;
      }
      
      // Check for mismatched/malicious TLDs or suspicious hyphens (e.g., paypal-secure-lock.cc)
      const hasBadTld = phishingTlds.some(tld => url.includes(tld));
      const isTrusted = trustedDomains.some(trusted => url.includes(trusted));
      const hasMultipleHyphens = (url.split('-').length - 1) >= 2;
      
      if (hasBadTld || (hasMultipleHyphens && !isTrusted) || (!isTrusted && url.toLowerCase().includes('paypal') && !url.includes('paypal.com'))) {
        hasSuspiciousUrls = true;
        break;
      }
    }
  }

  // Heuristic 2: Raw IP addresses in text
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  const hasIpAddresses = ipRegex.test(fullText);

  // Heuristic 3: Suspicious Keywords
  const triggeredKeywords: string[] = [];
  let urgentKeywordsCount = 0;
  for (const keyword of URGENCY_KEYWORDS) {
    if (fullText.includes(keyword)) {
      triggeredKeywords.push(keyword);
      urgentKeywordsCount++;
    }
  }
  const hasUrgencyKeywords = urgentKeywordsCount >= 2;

  // Heuristic 4: Requests for credentials and forms
  const credentialTerms = ['password', 'credentials', 'bank routing', 'credit card', 'social security', 'security keys', 'pin number', 'verify identity'];
  const hasFormInputs = credentialTerms.some(term => fullText.includes(term)) && (fullText.includes('verify') || fullText.includes('confirm') || fullText.includes('update') || fullText.includes('login') || fullText.includes('click'));

  // Heuristic 5: Sender domain mismatch
  // E.g., claim to be Google but sender domain is cz
  const claimsToBeGoogle = fullText.includes('google') || fullText.includes('gmail');
  const claimsToBePaypal = fullText.includes('paypal');
  const claimsToBeNetflix = fullText.includes('netflix');
  const claimsToBeMicrosoft = fullText.includes('microsoft') || fullText.includes('office 365');
  
  const senderDomain = senderLower.substring(senderLower.indexOf('@') + 1);
  
  let hasMismatchedSender = false;
  if (claimsToBeGoogle && !senderDomain.includes('google.com') && !senderDomain.includes('gmail.com')) hasMismatchedSender = true;
  if (claimsToBePaypal && !senderDomain.includes('paypal.com')) hasMismatchedSender = true;
  if (claimsToBeNetflix && !senderDomain.includes('netflix.com')) hasMismatchedSender = true;
  if (claimsToBeMicrosoft && !senderDomain.includes('microsoft.com') && !senderDomain.includes('microsoftonline.com')) hasMismatchedSender = true;

  // Heuristic 6: urgent punctuation
  const urgentPunctuationCount = (fullText.match(/!{2,}/g) || []).length + (fullText.match(/\?{2,}/g) || []).length;

  // Calculate high-level heuristic phishing score (0 to 1)
  let scoringTerms = 0;
  if (hasSuspiciousUrls) scoringTerms += 0.3;
  if (hasIpAddresses) scoringTerms += 0.15;
  if (hasUrgencyKeywords) scoringTerms += 0.25;
  if (hasFormInputs) scoringTerms += 0.2;
  if (hasMismatchedSender) scoringTerms += 0.2;
  if (urgentPunctuationCount > 0) scoringTerms += 0.1;
  
  const phishingHeuristicScore = Math.min(1, scoringTerms);

  return {
    textLength: email.body.length,
    hasSuspiciousUrls,
    hasIpAddresses,
    hasUrgencyKeywords,
    hasFormInputs,
    hasMismatchedSender,
    urgentPunctuationCount,
    senderDomain,
    triggeredKeywords,
    phishingHeuristicScore
  };
}

/**
 * Built-from-scratch Naive Bayes Machine Learning Engine with Laplace smoothing
 */
export class NaiveBayesClassifier {
  // Vocabulary mapping word String => word ID
  private vocab = new Set<string>();
  
  // Total emails trained
  private totalCount = 0;
  private phishingCount = 0;
  private safeCount = 0;

  // Prior probabilities
  private priorPhishing = 0.5;
  private priorSafe = 0.5;

  // Frequency distributions
  private wordCountsPhishing: Record<string, number> = {};
  private wordCountsSafe: Record<string, number> = {};
  private totalWordsPhishing = 0;
  private totalWordsSafe = 0;

  // Track logs
  public trainingLogs: string[] = [];

  constructor() {
    this.trainingLogs = ['Classifier instantiated. Please click Train to begin processing.'];
  }

  /**
   * Trains model on arrays of Emails
   */
  public train(emails: Email[]) {
    this.vocab.clear();
    this.totalCount = emails.length;
    this.phishingCount = 0;
    this.safeCount = 0;
    this.wordCountsPhishing = {};
    this.wordCountsSafe = {};
    this.totalWordsPhishing = 0;
    this.totalWordsSafe = 0;
    this.trainingLogs = [];

    this.log(`Received ${emails.length} emails for training.`);
    
    // Step 1: Count labels
    for (const email of emails) {
      if (email.label === 'phishing') {
        this.phishingCount++;
      } else {
        this.safeCount++;
      }
    }

    if (this.totalCount === 0) {
      this.priorPhishing = 0.5;
      this.priorSafe = 0.5;
      this.log('Empty dataset! Priors reset to 0.5.');
      return;
    }

    // Class priors (with Laplace-like smoothing for classes)
    this.priorPhishing = (this.phishingCount + 0.5) / (this.totalCount + 1);
    this.priorSafe = (this.safeCount + 0.5) / (this.totalCount + 1);

    this.log(`Class counts: Phishing = ${this.phishingCount}, Safe = ${this.safeCount}`);
    this.log(`Calculated priors: P(Phishing) = ${this.priorPhishing.toFixed(4)}, P(Safe) = ${this.priorSafe.toFixed(4)}`);

    // Step 2: Build vocabulary & frequencies
    this.log('Tokenizing bodies and subjects...');
    
    for (const email of emails) {
      const tokens = tokenizeText(`${email.subject} ${email.body}`);
      const filteredTokens = tokens.filter(t => !STOP_WORDS.has(t));
      
      for (const word of filteredTokens) {
        this.vocab.add(word);
        
        if (email.label === 'phishing') {
          this.wordCountsPhishing[word] = (this.wordCountsPhishing[word] || 0) + 1;
          this.totalWordsPhishing++;
        } else {
          this.wordCountsSafe[word] = (this.wordCountsSafe[word] || 0) + 1;
          this.totalWordsSafe++;
        }
      }
    }

    this.log(`Extracted total Vocabulary size: ${this.vocab.size} unique meaningful keywords.`);
    this.log(`Total active tokens mapped: Phishing bag = ${this.totalWordsPhishing}, Safe bag = ${this.totalWordsSafe}`);
    
    this.log('Calculated Conditional Word Probabilities applying additive Laplace Smoothing (alpha = 1.0).');
    this.log('Model ready for incoming validation metrics!');
  }

  private log(text: string) {
    this.trainingLogs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
  }

  /**
   * Helper to get word conditional probability with Laplace smoothing
   */
  private getWordCondProb(word: string, isPhishing: boolean): number {
    const wordCount = isPhishing 
      ? (this.wordCountsPhishing[word] || 0) 
      : (this.wordCountsSafe[word] || 0);
      
    const totalBagCount = isPhishing 
      ? this.totalWordsPhishing 
      : this.totalWordsSafe;

    // P(Word | Class) = (Count(word, class) + 1) / (Total Words in Class + Vocabulary Size)
    return (wordCount + 1.0) / (totalBagCount + this.vocab.size);
  }

  /**
   * Predicts class & evaluates contribution metrics on input Email
   */
  public predict(email: Email): PredictionResult {
    const htmlAndBodyFeatures = extractHeuristicFeatures(email);
    const tokens = tokenizeText(`${email.subject} ${email.body}`);
    const filteredTokens = tokens.filter(t => !STOP_WORDS.has(t));

    // Bayesian log likelihood computation
    // Log likelihood of phishing: log(P(Phishing)) + sum(log(P(word | Phishing)))
    // Log likelihood of safe: log(P(Safe)) + sum(log(P(word | Safe)))
    let logPhishing = Math.log(this.priorPhishing);
    let logSafe = Math.log(this.priorSafe);

    const wordContributions: PredictionResult['wordContributions'] = [];

    // Evaluate token conditional probs
    for (const token of filteredTokens) {
      if (this.vocab.has(token)) {
        const probPhish = this.getWordCondProb(token, true);
        const probSafe = this.getWordCondProb(token, false);
        
        logPhishing += Math.log(probPhish);
        logSafe += Math.log(probSafe);

        // Word contribution score based on likelihood log-ratio
        const ratio = probPhish / probSafe;
        const contrib = Math.log(ratio); // Positive for phishing leaning, negative for safe leaning
        
        const type = ratio > 1.3 ? 'phishing' : ratio < 0.77 ? 'safe' : 'neutral';
        
        // Prevent duplicate contribution visualizer rows
        if (!wordContributions.some(c => c.word === token)) {
          wordContributions.push({
            word: token,
            contribution: contrib,
            type
          });
        }
      }
    }

    // Softmax/Bayesian normalization to map log likelihoods back to a 0-1 probability
    // P(Phishing | Email) = exp(logPhish) / (exp(logPhish) + exp(logSafe))
    // We adjust by subtraction of max log-likelihoods to prevent floating-point underflow:
    const maxLog = Math.max(logPhishing, logSafe);
    const expPhish = Math.exp(logPhishing - maxLog);
    const expSafe = Math.exp(logSafe - maxLog);
    
    let probPhishingCombined = expPhish / (expPhish + expSafe);

    // Hybrid Fusion Strategy: Adjust bayesian model probability using high-signal cybersecurity rules
    // E.g., if there are suspicious URLs / Spoofed Senders / IP address, pull the threat level higher!
    const ruleMultiplier = htmlAndBodyFeatures.phishingHeuristicScore;
    if (ruleMultiplier > 0.4) {
      // Pull probability heavily up if rule indicates solid threat, especially for borderline text
      probPhishingCombined = Math.max(probPhishingCombined, ruleMultiplier);
    } else if (ruleMultiplier === 0 && probPhishingCombined > 0.8 && filteredTokens.length < 5) {
      // Mitigate false-alarm if message matches no cyber-rules and has very little token weights
      probPhishingCombined = Math.min(probPhishingCombined, 0.85);
    }

    const isPhishing = probPhishingCombined >= 0.5;

    // Filter contributions to top 8 highest impact words for summary render
    const sortedContributions = wordContributions
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 10);

    return {
      isPhishing,
      probability: probPhishingCombined,
      probabilities: {
        phishing: probPhishingCombined,
        safe: 1.0 - probPhishingCombined
      },
      features: htmlAndBodyFeatures,
      wordContributions: sortedContributions
    };
  }

  /**
   * Inspect vocabulary coefficients
   */
  public getVocabWeights(): WordFeatureWeight[] {
    const list: WordFeatureWeight[] = [];
    
    for (const word of this.vocab) {
      const phishCount = this.wordCountsPhishing[word] || 0;
      const safeCount = this.wordCountsSafe[word] || 0;
      
      const phishingProb = this.getWordCondProb(word, true);
      const safeProb = this.getWordCondProb(word, false);
      
      const ratio = phishingProb / safeProb;
      let label: 'phishing' | 'safe' | 'neutral' = 'neutral';
      
      if (ratio > 1.4) label = 'phishing';
      else if (ratio < 0.72) label = 'safe';

      list.push({
        word,
        phishingCount: phishCount,
        safeCount: safeCount,
        phishingProb,
        safeProb,
        ratio,
        label
      });
    }

    return list.sort((a, b) => b.ratio - a.ratio);
  }

  /**
   * Computes training metrics (accuracy, confusion matrix, recall, f1)
   */
  public evaluate(emails: Email[]): ModelMetrics {
    let tp = 0; // predicted phishing, actually phishing
    let fp = 0; // predicted phishing, actually safe
    let tn = 0; // predicted safe, actually safe
    let fn = 0; // predicted safe, actually phishing

    for (const email of emails) {
      const pred = this.predict(email);
      const actual = email.label === 'phishing';
      
      if (pred.isPhishing && actual) tp++;
      else if (pred.isPhishing && !actual) fp++;
      else if (!pred.isPhishing && !actual) tn++;
      else if (!pred.isPhishing && actual) fn++;
    }

    const total = emails.length || 1;
    const accuracy = (tp + tn) / total;
    
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: {
        truePositive: tp,
        falsePositive: fp,
        trueNegative: tn,
        falseNegative: fn
      }
    };
  }
}
