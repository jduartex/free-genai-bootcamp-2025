import { useEffect, useState } from 'react';
import SidebarMenu from '../components/SidebarMenu';

const Settings = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(response => response.json())
      .then(data => setSettings(data));
  }, []);

  return (
    <div className="flex">
      <SidebarMenu />
      <div className="content p-8 flex-1">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        {settings ? <p>{settings.preference}</p> : <p>Loading...</p>}
      </div>
    </div>
  );
};

export default Settings;
