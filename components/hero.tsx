'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/lib/blog-data';

const categoryColors: Record<BlogPost['category'], string> = {
  'Scam Alerts': 'bg-red-100 text-red-700',
  'Protection Guides': 'bg-orange-100 text-orange-700',
  'Account Recovery': 'bg-blue-100 text-blue-700',
  'Security Tools': 'bg-green-100 text-green-700',
};

export function Hero({ post }: { post: BlogPost }) {
  const categoryColor = categoryColors[post.category];

  return (
    <Link href={`/blog/${post.slug}`}>
      <section className="fade-in group relative h-96 w-full overflow-hidden rounded-xl md:h-[500px]">
        {/* Background Image */}
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/10 transition-opacity group-hover:opacity-80" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <div className="space-y-4">
            {/* Category Badge */}
            <div className="flex items-center gap-3">
              <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wider ${categoryColor}`}>
                {post.category}
              </span>
              <span className="text-sm text-white/80">{post.readTime} min read</span>
            </div>

            {/* Title */}
            <h1 className="max-w-4xl font-playfair text-5xl font-bold leading-tight text-white transition-colors group-hover:text-orange-300 md:text-6xl">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="max-w-2xl text-lg text-white/80">
              {post.excerpt}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-4 pt-2 text-sm text-white/70">
              <span>{post.author}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
          </div>
        </div>
      </section>
    </Link>
  );
}
