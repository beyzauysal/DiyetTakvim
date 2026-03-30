import { useState } from "react";
import { groupRecordsByDate, formatDiaryDayTitle } from "../../lib/nutritionDiary";
import apiClient from "../../api/apiClient";

function summarizeFoods(foods, max = 5) {
  if (!foods?.length) return "";
  const slice = foods.slice(0, max).join(", ");
  return foods.length > max ? `${slice}…` : slice;
}

function recordDateToInputValue(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseFoodsFromText(text) {
  return text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function NutritionDiarySection({
  records,
  mealTypeLabels,
  variant = "full",
  emptyMessage,
  heading = "Beslenme günlüğü",
  showHeading = true,
  id,
  intro,
  className = "",
  editable = false,
  onRecordMutated,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    mealType: "kahvalti",
    note: "",
    foodsText: "",
    totalCalories: "",
    imageUrl: "",
  });
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const mealTypeKeys = Object.keys(mealTypeLabels || {});

  const startEdit = (record) => {
    setEditingId(record._id);
    setEditError("");
    setEditForm({
      date: recordDateToInputValue(record.date),
      mealType: record.mealType || "kahvalti",
      note: record.note || "",
      foodsText: (record.foods || []).join("\n"),
      totalCalories: record.totalCalories ?? 0,
      imageUrl: record.imageUrl || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    const foods = parseFoodsFromText(editForm.foodsText);
    if (foods.length === 0) {
      setEditError("En az bir besin satırı girin (her satırda bir besin).");
      return;
    }
    const tc = Number(editForm.totalCalories);
    if (Number.isNaN(tc) || tc < 0) {
      setEditError("Geçerli bir kalori değeri girin.");
      return;
    }
    try {
      setSavingEdit(true);
      setEditError("");
      await apiClient.patch(`/api/calorie-records/${editingId}`, {
        date: editForm.date,
        mealType: editForm.mealType,
        note: editForm.note,
        imageUrl: editForm.imageUrl.trim(),
        foods,
        totalCalories: tc,
      });
      setEditingId(null);
      onRecordMutated?.();
    } catch (e) {
      setEditError(e.response?.data?.message || "Kayıt güncellenemedi.");
    } finally {
      setSavingEdit(false);
    }
  };

  const groups = groupRecordsByDate(records);
  const rootClass = ["nutrition-diary", className].filter(Boolean).join(" ");

  if (!records?.length) {
    if (emptyMessage == null) return null;
    return (
      <div className={`${rootClass} nutrition-diary--empty`.trim()} id={id}>
        {showHeading && heading ? (
          <h2 className="nutrition-diary-page-title">{heading}</h2>
        ) : null}
        {intro}
        <div className="record-card">
          <p style={{ margin: 0 }}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass} id={id}>
      {showHeading && heading ? (
        <h2 className="nutrition-diary-page-title">{heading}</h2>
      ) : null}
      {intro}
      {groups.map(({ dateKey, items }) => (
        <section key={dateKey} className="nutrition-diary-day">
          <h3 className="nutrition-diary-day-title">{formatDiaryDayTitle(dateKey)}</h3>
          <div
            className={
              variant === "compact"
                ? "nutrition-diary-entries nutrition-diary-entries--compact"
                : "nutrition-diary-entries"
            }
          >
            {items.map((record) =>
              variant === "full" ? (
                <div key={record._id} className="record-card">
                  {editable && editingId === record._id ? (
                    <div className="nutrition-diary-edit-form">
                      {editError ? (
                        <p className="nutrition-diary-edit-error" role="alert">
                          {editError}
                        </p>
                      ) : null}
                      <label className="form-label">
                        Tarih
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, date: e.target.value }))
                          }
                        />
                      </label>
                      <label className="form-label">
                        Öğün tipi
                        <select
                          value={editForm.mealType}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, mealType: e.target.value }))
                          }
                        >
                          {mealTypeKeys.map((key) => (
                            <option key={key} value={key}>
                              {mealTypeLabels[key] || key}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-label">
                        Besinler (her satırda bir madde)
                        <textarea
                          rows={4}
                          value={editForm.foodsText}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, foodsText: e.target.value }))
                          }
                        />
                      </label>
                      <label className="form-label">
                        Toplam kalori
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={editForm.totalCalories}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              totalCalories: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="form-label">
                        Not
                        <textarea
                          rows={2}
                          value={editForm.note}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, note: e.target.value }))
                          }
                        />
                      </label>
                      <label className="form-label">
                        Görsel bağlantısı (isteğe bağlı)
                        <input
                          type="text"
                          value={editForm.imageUrl}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, imageUrl: e.target.value }))
                          }
                          placeholder="https://..."
                        />
                      </label>
                      <div className="nutrition-diary-edit-actions">
                        <button
                          type="button"
                          disabled={savingEdit}
                          onClick={handleSaveEdit}
                        >
                          {savingEdit ? "Kaydediliyor…" : "Kaydet"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={savingEdit}
                          onClick={cancelEdit}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="appointment-top">
                        <h4 className="nutrition-diary-meal-title">
                          {mealTypeLabels[record.mealType] || record.mealType}
                        </h4>
                        <div className="nutrition-diary-card-head">
                          <span className="status-badge approved">
                            {record.totalCalories || 0} kcal
                          </span>
                          {editable ? (
                            <button
                              type="button"
                              className="btn-secondary nutrition-diary-edit-btn"
                              onClick={() => startEdit(record)}
                            >
                              Düzenle
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <p>
                        <strong>İçerik:</strong>{" "}
                        {record.foods && record.foods.length > 0
                          ? record.foods.join(", ")
                          : "Belirtilmedi"}
                      </p>

                      <p>
                        <strong>Not:</strong> {record.note || "Not yok"}
                      </p>

                      <p>
                        <strong>Fotoğraf:</strong>{" "}
                        {record.imageUrl ? (
                          <a
                            href={record.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontWeight: "600" }}
                          >
                            Görüntüle
                          </a>
                        ) : (
                          "Eklenmedi"
                        )}
                      </p>
                      {record.imageUrl ? (
                        <p style={{ marginTop: "8px" }}>
                          <img
                            src={record.imageUrl}
                            alt="Öğün"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "200px",
                              borderRadius: "12px",
                              objectFit: "cover",
                            }}
                          />
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : (
                <div key={record._id} className="nutrition-diary-compact-row">
                  <div className="nutrition-diary-compact-main">
                    <span className="nutrition-diary-compact-meal">
                      {mealTypeLabels[record.mealType] || record.mealType}
                    </span>
                    <span className="nutrition-diary-compact-detail">
                      {(() => {
                        const foods = summarizeFoods(record.foods, 4);
                        const note = (record.note || "").trim();
                        if (foods) return foods;
                        if (!note) return "—";
                        return note.length > 90 ? `${note.slice(0, 90)}…` : note;
                      })()}
                    </span>
                  </div>
                  <span className="nutrition-diary-compact-kcal">
                    {record.totalCalories || 0} kcal
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
