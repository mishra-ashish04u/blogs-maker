import { PostForm } from '@/components/admin/post-form';

export const dynamic = 'force-dynamic';

export default function AdminNewPostPage() {
  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-1.5 w-8 rounded-full bg-primary" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Draft
          </p>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-on-bg md:text-[3rem]">
          New Post.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Fill in the metadata and body, then publish — or save as a draft to come back to later.
        </p>
      </div>

      <PostForm mode="create" />
    </div>
  );
}
