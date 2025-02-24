import { useEffect, useState } from 'react';
import SidebarMenu from '../components/SidebarMenu';

const Home = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/home')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  return (
    <div className="flex">
      <SidebarMenu />
      <div className="content p-8 flex-1">
        <h1 className="text-2xl font-bold mb-4">Home</h1>
        {data ? <p>{data.message}</p> : <p>Loading...</p>}
      </div>
    </div>
  );
};

export default Home;
