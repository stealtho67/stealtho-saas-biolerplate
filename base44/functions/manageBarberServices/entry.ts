import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, serviceId, data, barberId: targetBarberId } = body;

    // --- Public read: no auth required ---
    if (action === 'listPublic') {
      if (!targetBarberId) {
        return Response.json({ error: 'barberId is required' }, { status: 400 });
      }
      let barber = null;
      try { barber = await base44.asServiceRole.entities.Barber.get(targetBarberId); } catch (_) {}
      if (!barber || barber.status !== 'active') {
        return Response.json({ services: [] });
      }
      const all = await base44.asServiceRole.entities.Service.filter({ barber_id: targetBarberId });
      const active = all.filter(s => s.active !== false);
      return Response.json({ services: active });
    }

    // --- All other actions require auth ---
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve the calling barber's record
    const barbers = await base44.asServiceRole.entities.Barber.filter({ user_email: user.email });
    const myBarber = barbers[0] || null;

    // --- List own services ---
    if (action === 'list') {
      if (!myBarber) return Response.json({ services: [] });
      const services = await base44.asServiceRole.entities.Service.filter({ barber_id: myBarber.id });
      return Response.json({ services });
    }

    // --- Create ---
    if (action === 'create') {
      if (!myBarber) return Response.json({ error: 'No barber profile found' }, { status: 403 });
      if (!data?.service_name?.trim()) return Response.json({ error: 'Service name is required' }, { status: 400 });
      if (typeof data.price !== 'number' || data.price <= 0) return Response.json({ error: 'Price must be a positive number' }, { status: 400 });
      if (typeof data.duration_minutes !== 'number' || data.duration_minutes <= 0) return Response.json({ error: 'Duration must be a positive number' }, { status: 400 });

      const service = await base44.asServiceRole.entities.Service.create({
        service_name: data.service_name.trim(),
        price: data.price,
        duration_minutes: data.duration_minutes,
        description: data.description || '',
        category: data.category || 'other',
        active: data.active !== false,
        barber_id: myBarber.id,
      });
      return Response.json({ service });
    }

    // --- Update & Delete: verify ownership first ---
    if (action === 'update' || action === 'delete') {
      if (!serviceId) return Response.json({ error: 'serviceId is required' }, { status: 400 });
      if (!myBarber) return Response.json({ error: 'No barber profile found' }, { status: 403 });

      const existing = await base44.asServiceRole.entities.Service.get(serviceId);
      if (!existing) return Response.json({ error: 'Service not found' }, { status: 404 });
      if (existing.barber_id !== myBarber.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      if (action === 'delete') {
        await base44.asServiceRole.entities.Service.delete(serviceId);
        return Response.json({ success: true });
      }

      // action === 'update'
      if (data.service_name !== undefined && !data.service_name.trim()) {
        return Response.json({ error: 'Service name cannot be empty' }, { status: 400 });
      }
      if (data.price !== undefined && (typeof data.price !== 'number' || data.price <= 0)) {
        return Response.json({ error: 'Price must be a positive number' }, { status: 400 });
      }
      if (data.duration_minutes !== undefined && (typeof data.duration_minutes !== 'number' || data.duration_minutes <= 0)) {
        return Response.json({ error: 'Duration must be a positive number' }, { status: 400 });
      }

      const updated = await base44.asServiceRole.entities.Service.update(serviceId, data);
      return Response.json({ service: updated });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('manageBarberServices error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});