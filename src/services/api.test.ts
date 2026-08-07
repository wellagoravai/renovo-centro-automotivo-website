import api from './api';

describe('api service', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({ status: 200 } as Response);
    // window.location.href = ... isn't implemented in jsdom navigation; swap in a
    // writable stub so the 401 branch can be asserted without a real navigation.
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  it('sends JSON with Content-Type application/json for a plain object body', async () => {
    await api.post('/customers', { name: 'Maria' });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'Maria' }));
  });

  it('omits Content-Type and sends the raw FormData when the body is a FormData instance', async () => {
    const formData = new FormData();
    formData.append('photo', 'fake-file-content');

    await api.post('/service-orders/1/photos', formData);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.body).toBe(formData);
  });

  it('attaches the Bearer token when one is present in localStorage', async () => {
    localStorage.setItem('token', 'abc123');

    await api.get('/customers');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Authorization']).toBe('Bearer abc123');
  });

  it('does not attach an Authorization header when there is no token', async () => {
    await api.get('/customers');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Authorization']).toBeUndefined();
  });

  it('clears stored session and redirects to /login on a 401 response', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('user', '{"id":1}');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 401 } as Response);

    await api.get('/customers');

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
