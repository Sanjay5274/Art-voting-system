import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Public voting system does not require login. Redirect to public gallery.
  redirect('/');
}

