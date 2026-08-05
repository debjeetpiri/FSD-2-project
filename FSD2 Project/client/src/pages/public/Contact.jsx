import { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill out all fields');
      return;
    }

    setSubmitted(true);
    toast.success('Thank you! Your message has been sent successfully.');
  };

  return (
    <div className="page-wrapper container animate-fadeInUp">
      <div className="text-center mb-6">
        <h1>Get in <span className="gradient-text">Touch</span></h1>
        <p className="text-muted">We'd love to hear from you. Send us a message or reach out directly!</p>
      </div>

      <div className="grid-2" style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Info column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { icon: <Mail size={20}/>, label: 'Email', value: 'support@eduflow.io' },
            { icon: <Phone size={20}/>, label: 'Phone', value: '+91 7542064429' },
            { icon: <MapPin size={20}/>, label: 'Address', value: 'EduFlow Tower, Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103, India' },
            { icon: <MessageSquare size={20}/>, label: 'Support Hours', value: 'Mon - Sat (9:00 AM - 7:00 PM IST)' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.25rem' }}>
              <div style={{ color: 'var(--clr-primary)', flexShrink: 0, marginTop: 2 }}>{icon}</div>
              <div>
                <div className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 2 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form column */}
        <div className="card">
          <h3 className="mb-4">Send a Message</h3>
          {submitted ? (
            <div className="text-center py-8 animate-fadeIn">
              <CheckCircle2 size={48} style={{ color: 'var(--clr-success)', margin: '0 auto 1rem' }} />
              <h3>Message Received!</h3>
              <p className="text-muted text-sm mt-2">
                Thank you for contacting us, {form.name}. Our support team will get back to you within 24 hours.
              </p>
              <button
                className="btn btn-secondary btn-sm mt-4"
                onClick={() => { setForm({ name: '', email: '', message: '' }); setSubmitted(false); }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="How can we help you today?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                <Send size={16}/> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
