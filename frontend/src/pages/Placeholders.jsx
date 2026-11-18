const PlaceholderPage = ({ title }) => (
  <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-xl">
    <div className="text-center">
      <p className="text-muted text-sm uppercase tracking-widest font-bold mb-2">Coming Soon</p>
      <h2 className="text-2xl font-heading text-white">{title}</h2>
    </div>
  </div>
);

export const Outputs = () => <PlaceholderPage title="Outputs Directory" />;
export const Clients = () => <PlaceholderPage title="Client Management" />;
export const Templates = () => <PlaceholderPage title="Template Library" />;
export const Analytics = () => <PlaceholderPage title="Performance Analytics" />;
export const Settings = () => <PlaceholderPage title="Workspace Settings" />;



