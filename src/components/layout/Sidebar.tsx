
import MobileSidebar from './sidebar/MobileSidebar';
import DesktopSidebar from './sidebar/DesktopSidebar';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <MobileSidebar isOpen={isOpen} onClose={onClose} />
      <DesktopSidebar />
    </>
  );
}
