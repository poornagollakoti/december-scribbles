import {
  Archive,
  ArrowUpRight,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  Eye,
  FilePenLine,
  Image as ImageIcon,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { Icon as BaseIcon } from '../icon';

/**
 * Studio icon vocabulary. Every entry is a Lucide outline icon rendered through the shared
 * <Icon> wrapper (one stroke width, consistent sizing), so the Studio and the public site
 * use one icon system. Icons are decorative; every icon-only control has its own label.
 */
type IconProps = { className?: string };

const make = (glyph: LucideIcon) =>
  function StudioIcon({ className }: IconProps) {
    return <BaseIcon icon={glyph} className={className} />;
  };

export const Icon = {
  overview: make(LayoutDashboard),
  writing: make(BookOpen),
  artwork: make(Images),
  media: make(ImageIcon),
  inbox: make(Inbox),
  settings: make(Settings2),
  plus: make(Plus),
  external: make(ArrowUpRight),
  eye: make(Eye),
  edit: make(Pencil),
  trash: make(Trash2),
  search: make(Search),
  menu: make(Menu),
  close: make(X),
  chevronDown: make(ChevronDown),
  chevronLeft: make(ChevronLeft),
  collapse: make(PanelLeftClose),
  warning: make(TriangleAlert),
  check: make(CircleCheck),
  upload: make(Upload),
  signOut: make(LogOut),
  send: make(Send),
  draft: make(FilePenLine),
  user: make(UserRound),
  bell: make(Bell),
  archive: make(Archive),
};
