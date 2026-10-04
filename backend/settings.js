const supabase = require('./db');

let visibilityCache = {
  val: true,
  timestamp: 0,
};

/**
 * Gets the current menu visibility status.
 * Defaults to true if not set or on error.
 */
async function getMenuVisibility() {
  const now = Date.now();
  if (now - visibilityCache.timestamp < 15000) {
    return visibilityCache.val;
  }
  try {
    const { data, error } = await supabase
      .from('order_counters')
      .select('last_value')
      .eq('id', 'show_menu')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, default to visible (true)
        return true;
      }
      console.error('Error fetching menu visibility setting:', error.message);
      return true;
    }

    const result = data ? data.last_value !== 0 : true;
    visibilityCache = { val: result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.error('Exception fetching menu visibility:', err);
    return true;
  }
}

/**
 * Sets the menu visibility status.
 * @param {boolean} visible 
 */
async function setMenuVisibility(visible) {
  try {
    const { data, error } = await supabase
      .from('order_counters')
      .upsert({ id: 'show_menu', last_value: visible ? 1 : 0 })
      .select();

    if (error) {
      console.error('Error updating menu visibility setting:', error.message);
      throw new Error(error.message);
    }
    visibilityCache = { val: visible, timestamp: Date.now() };
    return data;
  } catch (err) {
    console.error('Exception setting menu visibility:', err);
    throw err;
  }
}

/**
 * Gets the order accepting status (admin privilege).
 * Returns true if admin activated orders, false if paused / not taking orders.
 */
async function getOrdersActive() {
  return getMenuVisibility();
}

/**
 * Sets the order accepting status.
 * @param {boolean} active 
 */
async function setOrdersActive(active) {
  return setMenuVisibility(active);
}

// ============== EMAIL NOTIFICATION TOGGLES ==============

let emailNotifyCache = {
  preparing: { val: true, timestamp: 0 },
  completed: { val: true, timestamp: 0 },
};

/**
 * Gets whether email notifications are enabled for a given status.
 * @param {'preparing'|'completed'} type
 * @returns {Promise<boolean>}
 */
async function getEmailNotifyEnabled(type) {
  const key = `email_notify_${type}`;
  const cache = emailNotifyCache[type];
  const now = Date.now();

  if (cache && now - cache.timestamp < 15000) {
    return cache.val;
  }

  try {
    const { data, error } = await supabase
      .from('order_counters')
      .select('last_value')
      .eq('id', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return true; // default ON if row missing
      console.error(`Error fetching ${key}:`, error.message);
      return true;
    }

    const result = data ? data.last_value !== 0 : true;
    emailNotifyCache[type] = { val: result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.error(`Exception fetching ${key}:`, err);
    return true;
  }
}

/**
 * Sets whether email notifications are enabled for a given status.
 * @param {'preparing'|'completed'} type
 * @param {boolean} enabled
 */
async function setEmailNotifyEnabled(type, enabled) {
  const key = `email_notify_${type}`;
  try {
    const { data, error } = await supabase
      .from('order_counters')
      .upsert({ id: key, last_value: enabled ? 1 : 0 })
      .select();

    if (error) {
      console.error(`Error setting ${key}:`, error.message);
      throw new Error(error.message);
    }
    emailNotifyCache[type] = { val: enabled, timestamp: Date.now() };
    return data;
  } catch (err) {
    console.error(`Exception setting ${key}:`, err);
    throw err;
  }
}

module.exports = {
  getOrdersActive,
  setOrdersActive,
  getMenuVisibility,
  setMenuVisibility,
  getEmailNotifyEnabled,
  setEmailNotifyEnabled
};

