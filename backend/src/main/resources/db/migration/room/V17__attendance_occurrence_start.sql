-- До якого проведення заняття належить сеанс (початок за розкладом). Визначається при вході:
-- так присутність зараховується навіть якщо заняття розпочали раніше за розклад.
ALTER TABLE rooms.attendance_sessions ADD COLUMN occurrence_start TIMESTAMPTZ;
