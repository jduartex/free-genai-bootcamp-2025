import Link from 'next/link';

const SidebarMenu = () => {
  return (
    <div className="sidebar-menu bg-gray-800 text-white h-full p-4">
      <ul className="space-y-4">
        <li><Link href="/home"><a className="hover:text-gray-400">Home</a></Link></li>
        <li><Link href="/profile"><a className="hover:text-gray-400">Profile</a></Link></li>
        <li><Link href="/settings"><a className="hover:text-gray-400">Settings</a></Link></li>
      </ul>
    </div>
  );
};

export default SidebarMenu;
