// src/portfolio-store.js
import { supabase } from "../supabase.js";

const STORAGE_KEY = "soyon.portfolios.v1";

const PORTFOLIO_COLUMNS =
  "id,user_id,title,template_key,portfolio_data,status,created_at,updated_at";

function readAll() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    throw new Error(
      "Unable to save the local draft. Check your browser storage and try again."
    );
  }
}

function makeId() {
  return `local-${globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function normalizeRemote(row) {
  const content =
    row.portfolio_data && typeof row.portfolio_data === "object"
      ? row.portfolio_data
      : {};

  return {
    id: row.id,
    remote_id: row.id,
    user_id: row.user_id,
    title: row.title || content.title || "My Portfolio",
    template_key: row.template_key || content.template_key || "simple",
    content,
    status: row.status || "published",
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_remote: true
  };
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  if (!data.user) {
    throw new Error(
      "Please sign in before saving or managing account portfolios."
    );
  }

  return data.user;
}

function sortByUpdated(items) {
  return items.sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at || 0) -
      new Date(a.updated_at || a.created_at || 0)
  );
}

function findLocal(id) {
  return readAll().find(item =>
    String(item.id) === String(id) ||
    String(item.remote_id || "") === String(id)
  );
}

function getRemoteId(item) {
  if (!item) return null;
  return item.remote_id || (item.is_remote ? item.id : null);
}

function upsertLocal(item, replaceId = null) {
  let items = readAll();

  if (replaceId) {
    items = items.filter(
      existing => String(existing.id) !== String(replaceId)
    );
  }

  items = items.filter(existing => {
    const sameId = String(existing.id) === String(item.id);
    const sameRemoteId =
      item.remote_id &&
      String(existing.remote_id || existing.id) === String(item.remote_id);

    return !sameId && !sameRemoteId;
  });

  items.unshift(item);
  writeAll(items);

  return item;
}

function removeLocalReferences(ids = []) {
  const idSet = new Set(ids.filter(Boolean).map(String));

  const remaining = readAll().filter(item => {
    const localId = String(item.id);
    const remoteId = String(item.remote_id || "");

    return !idSet.has(localId) && !idSet.has(remoteId);
  });

  writeAll(remaining);
}

export const portfolioStore = {
  // Returns browser-local records only.
  async list() {
    return sortByUpdated(readAll());
  },

  async get(id) {
    if (!id) return null;

    const local = findLocal(id);
    if (local) return local;

    if (String(id).startsWith("local-")) return null;

    // Never retrieve another user's record.
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("portfolios")
      .select(PORTFOLIO_COLUMNS)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return upsertLocal(normalizeRemote(data));
  },

  // Used by the dashboard and portfolio collection page.
  async listForDashboard() {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("portfolios")
      .select(PORTFOLIO_COLUMNS)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const localItems = readAll();
    const remoteItems = (data || []).map(normalizeRemote);
    const remoteIds = new Set(remoteItems.map(item => String(item.id)));

    const mergedRemote = remoteItems.map(remote => {
      const local = localItems.find(item =>
        String(item.remote_id || item.id) === String(remote.id)
      );

      return local
        ? {
            ...remote,
            ...local,
            id: remote.id,
            remote_id: remote.id,
            user_id: remote.user_id,
            is_remote: true
          }
        : remote;
    });

    const localDrafts = localItems.filter(item =>
      !item.remote_id &&
      !item.is_remote &&
      !remoteIds.has(String(item.id))
    );

    return sortByUpdated([...localDrafts, ...mergedRemote]);
  },

  /**
   * Save a draft to localStorage only.
   *
   * If the supplied ID identifies an existing published record belonging
   * to the signed-in user, delete that matching Supabase row first.
   *
   * Deletion is restricted by BOTH id and user_id. If no matching row
   * exists, the local draft is still saved. Unrelated records are untouched.
   */
  async saveDraft(data, id = null) {
    const now = new Date().toISOString();
    const items = readAll();

    const existing = id
      ? items.find(item =>
          String(item.id) === String(id) ||
          String(item.remote_id || "") === String(id)
        )
      : null;

    let remoteId = getRemoteId(existing);

    // If the item isn't cached locally but its ID is not a local draft ID,
    // check for a matching remote record owned by the current user.
    if (!existing && id && !String(id).startsWith("local-")) {
      const user = await getCurrentUser();

      const { data: remote, error: lookupError } = await supabase
        .from("portfolios")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (remote) {
        remoteId = remote.id;
      }
    }

    // Delete only the current user's matching remote row.
    // A missing matching row is not an error.
    if (remoteId) {
      const user = await getCurrentUser();

      const { data: deletedRows, error: deleteError } = await supabase
        .from("portfolios")
        .delete()
        .eq("id", remoteId)
        .eq("user_id", user.id)
        .select("id");

      if (deleteError) {
        throw new Error(
          `The draft was not saved because the published record could not be removed: ${deleteError.message}`
        );
      }

      // No matching row is acceptable: it may already have been removed.
      // If a row was returned, it was the exact ID and owner we targeted.
      if (deletedRows?.length) {
        console.info("Removed the matching published portfolio record.");
      }
    }

    // Update an existing local-only draft in place.
    // A formerly published portfolio becomes a new local-only draft.
    const isExistingLocalDraft =
      existing &&
      !getRemoteId(existing) &&
      !existing.is_remote;

    let draft;

    if (isExistingLocalDraft) {
      draft = {
        ...existing,
        ...data,
        id: existing.id,
        remote_id: null,
        user_id: null,
        is_remote: false,
        status: "pending",
        created_at: existing.created_at || now,
        updated_at: now
      };
    } else {
      draft = {
        ...data,
        id: makeId(),
        remote_id: null,
        user_id: null,
        is_remote: false,
        status: "pending",
        created_at: now,
        updated_at: now
      };
    }

    // Remove stale local mirrors of the remote item, then save the draft.
    const oldIds = [
      id,
      remoteId,
      existing?.id,
      existing?.remote_id
    ];

    const oldIdSet = new Set(oldIds.filter(Boolean).map(String));

    const remaining = readAll().filter(item => {
      if (isExistingLocalDraft && String(item.id) === String(existing.id)) {
        return false;
      }

      return (
        !oldIdSet.has(String(item.id)) &&
        !oldIdSet.has(String(item.remote_id || ""))
      );
    });

    remaining.unshift(draft);
    writeAll(remaining);

    return draft;
  },

  // Publish to the signed-in user's Supabase account.
  // Existing published rows are updated; otherwise a new row is inserted.
  async saveToAccount(data, id = null) {
    const user = await getCurrentUser();

    // Search local cache without creating a new remote record.
    const local = id ? findLocal(id) : null;
    const remoteId = getRemoteId(local);

    const payload = {
      user_id: user.id,
      title: data.title || "My Portfolio",
      template_key: data.template_key || "simple",
      portfolio_data: data.content || {},
      status: "published",
      updated_at: new Date().toISOString()
    };

    let result;

    if (remoteId) {
      result = await supabase
        .from("portfolios")
        .update(payload)
        .eq("id", remoteId)
        .eq("user_id", user.id)
        .select(PORTFOLIO_COLUMNS)
        .single();
    } else {
      result = await supabase
        .from("portfolios")
        .insert(payload)
        .select(PORTFOLIO_COLUMNS)
        .single();
    }

    if (result.error) throw result.error;

    const saved = normalizeRemote(result.data);

    // Replace the local draft copy after publishing.
    return upsertLocal(
      saved,
      local && !getRemoteId(local) ? local.id : null
    );
  },

  async publish(data, id = null) {
    return this.saveToAccount(data, id);
  },

  async saveChanges(data, id = null) {
    return this.saveToAccount(data, id);
  },

  // Rename a portfolio or change its status.
  async update(id, changes = {}) {
    const item = await this.get(id);

    if (!item) {
      throw new Error("This portfolio could not be found.");
    }

    const now = new Date().toISOString();
    const nextTitle = changes.title ?? item.title;
    const nextStatus = changes.status ?? item.status;

    if (!["pending", "draft", "published"].includes(nextStatus)) {
      throw new Error("Invalid portfolio status.");
    }

    const content = {
      ...(item.content || {}),
      ...(changes.content || {}),
      title: nextTitle,
      template_key: changes.template_key || item.template_key || "simple"
    };

    const remoteId = getRemoteId(item);

    if (remoteId) {
      const user = await getCurrentUser();

      const databaseStatus =
        nextStatus === "published" ? "published" : "draft";

      const { data, error } = await supabase
        .from("portfolios")
        .update({
          title: nextTitle,
          template_key: content.template_key,
          portfolio_data: content,
          status: databaseStatus,
          updated_at: now
        })
        .eq("id", remoteId)
        .eq("user_id", user.id)
        .select(PORTFOLIO_COLUMNS)
        .single();

      if (error) throw error;

      return upsertLocal(normalizeRemote(data));
    }

    const updated = {
      ...item,
      ...changes,
      title: nextTitle,
      content,
      status: nextStatus,
      updated_at: now
    };

    return upsertLocal(updated);
  },

  // Delete one portfolio. Remote deletion is always scoped to the owner.
  async remove(id) {
    const item = findLocal(id) || await this.get(id);

    if (!item) {
      throw new Error("This portfolio could not be found.");
    }

    const remoteId = getRemoteId(item);

    if (remoteId) {
      const user = await getCurrentUser();

      const { error } = await supabase
        .from("portfolios")
        .delete()
        .eq("id", remoteId)
        .eq("user_id", user.id);

      if (error) throw error;
    }

    removeLocalReferences([id, remoteId, item.id, item.remote_id]);
  }
};