"use client";

import { Button } from "@/components/ui/Button";

/* ── Layout helpers ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs text-gray-400 mt-1 text-center">
      {children}
    </span>
  );
}

/* ── Catalog ── */

export function ButtonCatalog() {
  return (
    <div className="space-y-12">
      {/* ── Variants ── */}
      <Section title="Variants">
        <div>
          <Button variant="primary">Primary</Button>
          <Label>primary</Label>
        </div>
        <div>
          <Button variant="secondary">Secondary</Button>
          <Label>secondary</Label>
        </div>
        <div>
          <Button variant="ghost">Ghost</Button>
          <Label>ghost</Label>
        </div>
        <div>
          <Button variant="destructive">Destructive</Button>
          <Label>destructive</Label>
        </div>
        <div>
          <Button variant="destructive-soft">Destructive Soft</Button>
          <Label>destructive-soft</Label>
        </div>
        <div>
          <Button variant="outline">Outline</Button>
          <Label>outline</Label>
        </div>
        <div>
          <Button variant="link">Link style</Button>
          <Label>link</Label>
        </div>
      </Section>

      {/* ── Sizes ── */}
      <Section title="Sizes">
        <div>
          <Button size="sm">Small</Button>
          <Label>sm</Label>
        </div>
        <div>
          <Button size="md">Medium</Button>
          <Label>md (default)</Label>
        </div>
        <div>
          <Button size="lg">Large</Button>
          <Label>lg</Label>
        </div>
      </Section>

      {/* ── Sizes × Secondary ── */}
      <Section title="Sizes — Secondary">
        <div>
          <Button variant="secondary" size="sm">Small</Button>
          <Label>secondary / sm</Label>
        </div>
        <div>
          <Button variant="secondary" size="md">Medium</Button>
          <Label>secondary / md</Label>
        </div>
        <div>
          <Button variant="secondary" size="lg">Large</Button>
          <Label>secondary / lg</Label>
        </div>
      </Section>

      {/* ── Shapes ── */}
      <Section title="Shapes">
        <div>
          <Button shape="default">Rounded XL</Button>
          <Label>default (rounded-xl)</Label>
        </div>
        <div>
          <Button shape="pill">Pill Shape</Button>
          <Label>pill (rounded-full)</Label>
        </div>
        <div>
          <Button variant="outline" shape="pill">Outline Pill</Button>
          <Label>outline / pill</Label>
        </div>
        <div>
          <Button variant="ghost" shape="pill">Ghost Pill</Button>
          <Label>ghost / pill</Label>
        </div>
      </Section>

      {/* ── Outline Colors ── */}
      <Section title="Outline — Custom Colors">
        <div>
          <Button variant="outline">Default Gray</Button>
          <Label>no props (gray)</Label>
        </div>
        <div>
          <Button variant="outline" outlineColor="var(--primary)" outlineHoverColor="var(--secondary)">Primary → Secondary</Button>
          <Label>primary / hover secondary</Label>
        </div>
        <div>
          <Button variant="outline" outlineColor="var(--secondary)" outlineHoverColor="var(--primary)">Secondary → Primary</Button>
          <Label>secondary / hover primary</Label>
        </div>
        <div>
          <Button variant="outline" outlineColor="#ef4444" outlineHoverColor="#dc2626">Red Outline</Button>
          <Label>red-500 / hover red-600</Label>
        </div>
        <div>
          <Button variant="outline" outlineColor="var(--primary)" outlineHoverColor="var(--primary)">Primary</Button>
          <Label>primary (same hover)</Label>
        </div>
        <div>
          <Button variant="outline" outlineColor="#111827">Dark</Button>
          <Label>gray-900 (same hover)</Label>
        </div>
      </Section>

      {/* ── Full Width ── */}
      <Section title="Full Width">
        <div className="w-full space-y-3">
          <Button fullWidth>Primary Full Width</Button>
          <Button variant="secondary" fullWidth>Secondary Full Width</Button>
          <Button variant="ghost" fullWidth>Ghost Full Width</Button>
          <Button variant="outline" fullWidth>Outline Full Width</Button>
        </div>
      </Section>

      {/* ── Disabled ── */}
      <Section title="Disabled States">
        <div>
          <Button disabled>Primary</Button>
          <Label>primary / disabled</Label>
        </div>
        <div>
          <Button variant="secondary" disabled>Secondary</Button>
          <Label>secondary / disabled</Label>
        </div>
        <div>
          <Button variant="destructive" disabled>Destructive</Button>
          <Label>destructive / disabled</Label>
        </div>
        <div>
          <Button variant="ghost" disabled>Ghost</Button>
          <Label>ghost / disabled</Label>
        </div>
        <div>
          <Button variant="outline" disabled>Outline</Button>
          <Label>outline / disabled</Label>
        </div>
      </Section>

      {/* ── Icon Only ── */}
      <Section title="Icon Only">
        <div>
          <Button variant="ghost" iconOnly size="sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </Button>
          <Label>ghost / sm</Label>
        </div>
        <div>
          <Button variant="ghost" iconOnly size="md">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </Button>
          <Label>ghost / md</Label>
        </div>
        <div>
          <Button variant="outline" iconOnly size="md" shape="pill">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </Button>
          <Label>outline / pill / md</Label>
        </div>
        <div>
          <Button variant="outline" iconOnly size="md" shape="pill">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </Button>
          <Label>outline / pill / md</Label>
        </div>
        <div>
          <Button variant="primary" iconOnly size="lg" shape="pill">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          </Button>
          <Label>primary / pill / lg</Label>
        </div>
      </Section>

      {/* ── Common Combos ── */}
      <Section title="Common Use-Case Combos">
        <div className="w-full max-w-md space-y-3">
          <Button fullWidth size="lg">Sign In</Button>
          <Label>Auth form CTA</Label>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Delete</Button>
          <Label>Confirm dialog pair</Label>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost">Cancel</Button>
          <Button variant="secondary">Save</Button>
          <Label>Settings pair</Label>
        </div>
        <div>
          <Button variant="primary" shape="pill">Generate Challenge</Button>
          <Label>Dashboard pill CTA</Label>
        </div>
        <div>
          <Button variant="link">Edit Profile →</Button>
          <Label>Inline link action</Label>
        </div>
      </Section>

      {/* ── Button Pair Layout ── */}
      <Section title="Side-by-side Layouts">
        <div className="w-full max-w-md">
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth>Add to Hobbies</Button>
            <Button variant="outline" fullWidth>Sample First</Button>
          </div>
          <Label>Modal footer — two equal buttons</Label>
        </div>
        <div className="w-full max-w-md">
          <div className="space-y-3">
            <Button fullWidth>Commit to Photography</Button>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth>Watch a Video</Button>
              <Button variant="secondary" fullWidth>Find Nearby</Button>
            </div>
          </div>
          <Label>SamplingCTA — commit + two links</Label>
        </div>
      </Section>
    </div>
  );
}
