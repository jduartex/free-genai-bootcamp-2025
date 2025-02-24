import { useEffect, useState } from 'react';
import SidebarMenu from '../components/SidebarMenu';

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(response => response.json())
      .then(data => setProfile(data));
  }, []);

  return (
    <div className="flex">
      <SidebarMenu />
      <div className="content p-8 flex-1">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        {profile ? <p>{profile.name}</p> : <p>Loading...</p>}
      </div>
    </div>
  );
};

export default Profile;
