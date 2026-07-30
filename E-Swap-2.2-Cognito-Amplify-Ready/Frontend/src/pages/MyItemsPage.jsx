import { Edit3, Eye, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import TokenAmount from '../components/TokenAmount.jsx';
import { useStore } from '../context/StoreContext.jsx';

export default function MyItemsPage() {
  const { db, currentUser, deleteItem, pushToast } = useStore();
  const items = db.items.filter((item) => item.ownerId === currentUser.id && item.status !== 'deleted').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try { await deleteItem(item.id); } catch (error) { pushToast(error.message, 'error'); }
  }

  return (
    <section className="page-section page-width">
      <div className="page-heading-row"><div className="page-heading compact-heading"><span className="eyebrow">Listing management</span><h1>My items</h1><p>Create, edit and monitor your marketplace listings.</p></div><Link className="button button-primary" to="/create-item"><Plus size={18} /> List an item</Link></div>
      {items.length ? <div className="management-list">
        {items.map((item) => <article className="management-card" key={item.id}>
          <img src={item.imageUrl} alt={item.title} />
          <div className="management-card-main"><div><span className={`status-pill status-${item.status}`}>{item.status}</span><span className="subtle-pill">{item.actionType}</span></div><h2>{item.title}</h2><p>{item.category} · {item.condition} · {item.location}</p><div className="management-stats"><TokenAmount amount={item.tokenPrice} /><span><Eye size={16} /> {item.views || 0} views</span></div>{item.status === 'reserved' && <small className="reserved-help">This item has an escrow order. Manage it from Orders.</small>}</div>
          <div className="management-actions"><Link className="icon-button" to={`/items/${item.id}`} title="View"><Eye /></Link>{item.status === 'active' && <Link className="icon-button" to={`/edit-item/${item.id}`} title="Edit"><Edit3 /></Link>}{item.status === 'reserved' ? <Link className="icon-button" to="/orders" title="Open order"><ShoppingBag /></Link> : <button type="button" className="icon-button danger" onClick={() => remove(item)} title="Delete"><Trash2 /></button>}</div>
        </article>)}
      </div> : <EmptyState icon={Package} title="No listings yet" description="Publish an item to begin testing the seller journey." action={<Link className="button button-primary" to="/create-item">Create first listing</Link>} />}
    </section>
  );
}
