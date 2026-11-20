import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured, type PostRow } from '@/lib/supabase/types';
import { SITE, type Category } from '@/lib/site';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  author: string;
  date: string;
  readTime: number;
  coverImage: string;
  content: string;
}

function rowToPost(row: PostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    author: row.author,
    date: row.date,
    readTime: row.read_time,
    coverImage: row.cover_image,
    content: row.content,
  };
}

/**
 * Sample posts. Shown only when Supabase is not configured or has no
 * published posts, and loaded as DRAFTS by `npm run seed`. They are short
 * starting points — expand them before publishing.
 */
export const staticBlogPosts: BlogPost[] = [
  {
    slug: 'fake-parcel-delivery-text-scam',
    title: 'Fake Parcel Delivery Texts: How to Spot the “Missed Delivery” Scam',
    excerpt:
      'A text says your parcel is on hold and asks you to pay a small redelivery fee. Here is how the scam works and how to check safely.',
    category: 'Scam Alerts',
    author: SITE.author,
    date: 'April 15, 2026',
    readTime: 5,
    coverImage: '/images/phishing-cover.jpg',
    content: `
    <h2>How the scam works</h2>
    <p>You get a text that looks like it comes from a delivery company: your parcel could not be delivered and you need to confirm your address or pay a small fee. The link leads to a convincing copy of the courier’s website that collects your card details.</p>
    <h2>Red flags</h2>
    <ul>
      <li>You were not expecting a parcel, or the message does not name the sender.</li>
      <li>The link does not go to the courier’s real website address.</li>
      <li>You are asked to pay a fee or re-enter card details to “release” a parcel.</li>
    </ul>
    <h2>What to do instead</h2>
    <p>Do not tap the link. Open the courier’s official app or type its website address yourself and enter the tracking number from your original order confirmation. If you already entered card details, call your bank straight away using the number on the back of your card.</p>
    `,
  },
  {
    slug: 'what-to-do-first-hour-after-account-hacked',
    title: 'Hacked? What to Do in the First Hour After Losing an Account',
    excerpt:
      'Speed matters when an account is taken over. Follow these steps in order to lock the attacker out and limit the damage.',
    category: 'Account Recovery',
    author: SITE.author,
    date: 'April 10, 2026',
    readTime: 6,
    coverImage: '/images/ransomware-cover.jpg',
    content: `
    <h2>1. Try to sign in and change the password</h2>
    <p>If you can still get in, change the password to a new one you have never used anywhere else, then sign out of all other sessions from the account’s security settings.</p>
    <h2>2. Use the official recovery process</h2>
    <p>If the password no longer works, use the service’s own “forgot password” or account-recovery page. Never pay someone who contacts you offering to recover an account — that is a second scam.</p>
    <h2>3. Secure your email first</h2>
    <p>Your email account can reset every other password, so secure it before anything else and turn on two-factor authentication.</p>
    <h2>4. Warn your contacts</h2>
    <p>Attackers often message friends from a hijacked account asking for money. Tell people not to respond to unusual requests that appear to come from you.</p>
    `,
  },
  {
    slug: 'turn-on-two-factor-authentication-guide',
    title: 'Turn On Two-Factor Authentication: A 10-Minute Guide for Your Main Accounts',
    excerpt:
      'Two-factor authentication stops most account takeovers. Here is what it is and which accounts to protect first.',
    category: 'Protection Guides',
    author: SITE.author,
    date: 'April 5, 2026',
    readTime: 5,
    coverImage: '/images/zero-day-cover.jpg',
    content: `
    <h2>What two-factor authentication does</h2>
    <p>Two-factor authentication (2FA) asks for a second proof that it is really you — usually a code from an app or a prompt on your phone — in addition to your password. A stolen password alone is then not enough.</p>
    <h2>Start with these accounts</h2>
    <ul>
      <li>Your main email account</li>
      <li>Banking and payment apps</li>
      <li>Social media and messaging accounts</li>
    </ul>
    <h2>Choose the right method</h2>
    <p>An authenticator app or a passkey is safer than codes sent by text message, because text codes can be intercepted through SIM-swap fraud.</p>
    `,
  },
  {
    slug: 'how-to-choose-a-password-manager',
    title: 'Password Managers Explained: Why You Need One and How to Choose',
    excerpt:
      'Reusing passwords is how one leak turns into many hacked accounts. A password manager fixes that. Here is what to look for.',
    category: 'Security Tools',
    author: SITE.author,
    date: 'March 30, 2026',
    readTime: 6,
    coverImage: '/images/api-security-cover.jpg',
    content: `
    <h2>Why password reuse is dangerous</h2>
    <p>When a website is breached, criminals try the leaked email and password combinations on other sites. If you reuse passwords, one breach can unlock many of your accounts.</p>
    <h2>What a password manager does</h2>
    <p>It creates a strong, unique password for every account, stores them in an encrypted vault, and fills them in for you. You only need to remember one strong master password.</p>
    <h2>What to look for</h2>
    <ul>
      <li>Works on all your devices and browsers</li>
      <li>Supports two-factor authentication and passkeys</li>
      <li>Has a clear security track record and independent audits</li>
    </ul>
    `,
  },
  {
    slug: 'fake-online-shop-red-flags',
    title: 'Fake Online Shops: Red Flags to Check Before You Pay',
    excerpt:
      'Too-good-to-be-true prices and brand-new websites are the classic signs of a fake shop. Run through this checklist before buying.',
    category: 'Scam Alerts',
    author: SITE.author,
    date: 'March 25, 2026',
    readTime: 5,
    coverImage: '/images/supply-chain-cover.jpg',
    content: `
    <h2>Common warning signs</h2>
    <ul>
      <li>Prices far below every other retailer</li>
      <li>No real contact address or phone number</li>
      <li>Payment only by bank transfer, gift cards or cryptocurrency</li>
      <li>Reviews that are all perfect, or none at all</li>
    </ul>
    <h2>Pay safely</h2>
    <p>Use a credit card or a payment service with buyer protection. Bank transfers and gift cards are almost impossible to get back once sent.</p>
    `,
  },
  {
    slug: 'protect-elderly-parents-from-phone-scams',
    title: 'How to Protect Elderly Parents from Phone Scams',
    excerpt:
      'Scammers target older people with urgent calls from fake banks, police and relatives. A few simple family rules make a big difference.',
    category: 'Protection Guides',
    author: SITE.author,
    date: 'March 18, 2026',
    readTime: 6,
    coverImage: '/images/quantum-cover.jpg',
    content: `
    <h2>The calls to watch for</h2>
    <p>Typical scripts include a “bank” reporting fraud on the account, “police” claiming a relative has been arrested, or a grandchild in trouble who needs money urgently and asks for secrecy.</p>
    <h2>Agree on simple family rules</h2>
    <ul>
      <li>Banks and police never ask you to move money to a “safe account”.</li>
      <li>Hang up and call back on a number you already know.</li>
      <li>Agree a family code word for real emergencies.</li>
    </ul>
    `,
  },
];

async function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const supabase = await getSupabase();
  if (!supabase) return staticBlogPosts;
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('[blog-data] Supabase read failed, using static fallback:', error?.message);
    return staticBlogPosts;
  }
  if (data.length === 0) return staticBlogPosts;
  return (data as PostRow[]).map(rowToPost);
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const supabase = await getSupabase();
  if (!supabase) return staticBlogPosts.find((p) => p.slug === slug);
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (data) return rowToPost(data as PostRow);
  if (error) return staticBlogPosts.find((p) => p.slug === slug);

  // Not found. Samples are only served while nothing real is published
  // (mirrors getAllPosts), so they never linger next to real content.
  const { count } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  return count ? undefined : staticBlogPosts.find((p) => p.slug === slug);
}

export async function getFeaturedPost(): Promise<BlogPost> {
  const all = await getAllPosts();
  return all[0];
}
