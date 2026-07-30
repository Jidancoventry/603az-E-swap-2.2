import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ListingForm from '../components/ListingForm.jsx';
import { useStore } from '../context/StoreContext.jsx';

export default function CreateItemPage() {
  const { createItem, currentUser, pushToast } = useStore();
  const navigate = useNavigate();
  async function submit(values) {
    try {
      const id = await createItem({ ...values, location: values.location || currentUser.location });
      navigate(`/items/${id}`);
    } catch (error) {
      pushToast(error.message, 'error');
    }
  }
  return <section className="page-section page-width"><Link className="back-link" to="/my-items"><ArrowLeft size={17} /> Back to my items</Link><div className="page-heading compact-heading"><span className="eyebrow">New listing</span><h1>List an electronic item</h1><p>Add enough detail to help another member make a confident decision.</p></div><ListingForm initialValues={{ location: currentUser.location }} onSubmit={submit} /></section>;
}
