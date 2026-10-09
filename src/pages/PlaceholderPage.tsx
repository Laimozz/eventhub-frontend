interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <h1>{title}</h1>
    </div>
  );
}
