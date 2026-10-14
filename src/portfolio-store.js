const STORAGE_KEY = "soyon.portfolios.v1";

function readAll() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ||
    `portfolio-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const portfolioStore = {
  async list() {
    return readAll().sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
  },

  async get(id) {
    return readAll().find(
      item => String(item.id) === String(id)
    ) || null;
  },

  async save(data, id = null) {
    const all = readAll();
    const now = new Date().toISOString();

    if (id) {
      const index = all.findIndex(
        item => String(item.id) === String(id)
      );

      if (index < 0) {
        throw new Error(
          "This portfolio no longer exists. Please save it as a new portfolio."
        );
      }

      all[index] = {
        ...all[index],
        ...data,
        id: all[index].id,
        updated_at: now
      };

      writeAll(all);
      return all[index];
    }

    const item = {
      ...data,
      id: makeId(),
      status: "draft",
      created_at: now,
      updated_at: now
    };

    all.unshift(item);
    writeAll(all);
    return item;
  },

  async update(id, changes) {
    const all = readAll();
    const index = all.findIndex(
      item => String(item.id) === String(id)
    );

    if (index < 0) {
      throw new Error("Portfolio not found.");
    }

    all[index] = {
      ...all[index],
      ...changes,
      updated_at: new Date().toISOString()
    };

    writeAll(all);
    return all[index];
  },

  async remove(id) {
    const all = readAll();
    const next = all.filter(
      item => String(item.id) !== String(id)
    );

    if (next.length === all.length) {
      throw new Error("Portfolio not found.");
    }

    writeAll(next);
  }
};
