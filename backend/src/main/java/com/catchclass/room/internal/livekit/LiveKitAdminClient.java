package com.catchclass.room.internal.livekit;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.catchclass.room.internal.config.LiveKitProperties;
import com.catchclass.shared.web.ApiException;

import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels;

import retrofit2.Call;
import retrofit2.Response;

@Component
public class LiveKitAdminClient {

    private final RoomServiceClient client;

    public LiveKitAdminClient(LiveKitProperties properties) {
        // LIVEKIT_URL (wss://...) LiveKit сам конвертує в https:// для цих REST-викликів —
        // той самий URL, що й для підключення клієнтів, підходить і тут без змін.
        this.client = RoomServiceClient.createClient(properties.url(), properties.apiKey(), properties.apiSecret());
    }

    public void removeParticipant(String roomName, String identity) {
        runOrThrow(client.removeParticipant(roomName, identity), "kick_failed", "Не вдалося видалити учасника");
    }

    public void deleteRoom(String roomName) {
        runOrThrow(client.deleteRoom(roomName), "end_meeting_failed", "Не вдалося завершити заняття");
    }

    /**
     * Глушить мікрофон (аудіотреки) усіх учасників кімнати, хто ще не заглушений,
     * окрім excludeIdentity — організатора, який і натиснув «Mute all»: самого себе
     * це не повинно стосуватись.
     */
    public void muteAllAudio(String roomName, String excludeIdentity) {
        for (LivekitModels.ParticipantInfo participant : listParticipants(roomName)) {
            if (participant.getIdentity().equals(excludeIdentity)) {
                continue;
            }
            // Спершу забираємо право публікувати мікрофон — інакше людина просто натисне
            // кнопку мікрофона знову, і "мут" нічого б не означав.
            setMicrophoneAllowed(roomName, participant, false);
            for (LivekitModels.TrackInfo track : participant.getTracksList()) {
                if (track.getType() == LivekitModels.TrackType.AUDIO && !track.getMuted()) {
                    runOrThrow(
                            client.mutePublishedTrack(roomName, participant.getIdentity(), track.getSid(), true),
                            "mute_failed", "Не вдалося заглушити учасника");
                }
            }
        }
    }

    /**
     * Повторне "підтискання" режиму «Заглушити всіх», яке викликається за таймером, поки він
     * діє. Саме право на мікрофон (canPublishSources) LiveKit перевіряє лише в момент нової
     * публікації, а вже опублікований заглушений трек учасник може розглушити сам. Тому тут:
     * знову забираємо право на мікрофон (якщо воно десь з'явилось) і глушимо будь-який
     * аудіотрек, який хтось таки встиг увімкнути. Повертає кількість учасників у кімнаті
     * (0 — кімната порожня або недоступна).
     */
    public int enforceAudioMuted(String roomName, String excludeIdentity) {
        List<LivekitModels.ParticipantInfo> participants = listParticipants(roomName);
        for (LivekitModels.ParticipantInfo participant : participants) {
            if (participant.getIdentity().equals(excludeIdentity)) {
                continue;
            }
            setMicrophoneAllowed(roomName, participant, false);
            for (LivekitModels.TrackInfo track : participant.getTracksList()) {
                if (track.getType() == LivekitModels.TrackType.AUDIO && !track.getMuted()) {
                    runOrThrow(
                            client.mutePublishedTrack(roomName, participant.getIdentity(), track.getSid(), true),
                            "mute_failed", "Не вдалося заглушити учасника");
                }
            }
        }
        return participants.size();
    }

    /**
     * Знімає заглушення з аудіотреків усіх учасників, окрім excludeIdentity. ВАЖЛИВО:
     * LiveKit дозволяє серверу примусовоUNMUTE лише трек, який сам сервер і заглушив —
     * якщо людина вимкнула мікрофон собі сама, цей виклик її не торкнеться (так влаштовано
     * в LiveKit навмисно, як захист приватності, а не наша недоробка).
     */
    public void unmuteAllAudio(String roomName, String excludeIdentity) {
        for (LivekitModels.ParticipantInfo participant : listParticipants(roomName)) {
            if (participant.getIdentity().equals(excludeIdentity)) {
                continue;
            }
            // Повертаємо право на мікрофон: людина знову зможе сама його ввімкнути.
            setMicrophoneAllowed(roomName, participant, true);
            for (LivekitModels.TrackInfo track : participant.getTracksList()) {
                if (track.getType() == LivekitModels.TrackType.AUDIO && track.getMuted()) {
                    runOrThrow(
                            client.mutePublishedTrack(roomName, participant.getIdentity(), track.getSid(), false),
                            "unmute_failed", "Не вдалося увімкнути мікрофон учасника");
                }
            }
        }
    }

    /**
     * Дає учаснику право демонструвати екран (додатково до вже наявних камери/мікрофона),
     * коли організатор схвалив його запит. Діє "на льоту" — LiveKit сам повідомляє клієнта
     * про нові права, перепідключення не потрібне.
     *
     * Сигнатура updateParticipant(room, identity, name, metadata, permission) —
     * підтверджено помилкою компілятора (4-й параметр очікує String-metadata, а не
     * ParticipantPermission): об'єкт прав передається останнім, а не 4-м аргументом.
     */
    public void allowScreenShare(String roomName, String identity) {
        LivekitModels.ParticipantInfo info = findParticipant(roomName, identity);
        LivekitModels.ParticipantPermission.Builder builder = basePermission(info);
        List<LivekitModels.TrackSource> sources = new ArrayList<>(builder.getCanPublishSourcesList());
        if (info == null) {
            // Учасника не знайшли в кімнаті — лишаємо поведінку за замовчуванням: усі чотири джерела.
            sources = new ArrayList<>(List.of(
                    LivekitModels.TrackSource.CAMERA, LivekitModels.TrackSource.MICROPHONE));
        }
        if (sources.isEmpty()) {
            return; // порожній список у LiveKit = "дозволено все", додавати нічого
        }
        // Камеру/мікрофон лишаємо такими, якими вони є зараз (мікрофон міг бути заборонений
        // через «Заглушити всіх»), додаємо лише екран.
        addIfMissing(sources, LivekitModels.TrackSource.SCREEN_SHARE);
        addIfMissing(sources, LivekitModels.TrackSource.SCREEN_SHARE_AUDIO);
        builder.clearCanPublishSources().addAllCanPublishSources(sources);
        runOrThrow(
                client.updateParticipant(roomName, identity, null, null, builder.build()),
                "screen_share_grant_failed", "Не вдалося надати дозвіл на демонстрацію екрана");
    }

    /**
     * Дозволяє/забороняє учаснику публікувати мікрофон, не чіпаючи інших його прав
     * (камера, демонстрація екрана). Порожній список джерел у LiveKit означає "дозволено
     * все", тому при забороні його спершу розгортаємо в явний список без мікрофона.
     */
    private void setMicrophoneAllowed(String roomName, LivekitModels.ParticipantInfo participant, boolean allowed) {
        LivekitModels.ParticipantPermission.Builder builder = basePermission(participant);
        List<LivekitModels.TrackSource> sources = new ArrayList<>(builder.getCanPublishSourcesList());
        if (sources.isEmpty()) {
            if (allowed) {
                return; // і так дозволено все
            }
            sources = new ArrayList<>(List.of(
                    LivekitModels.TrackSource.CAMERA,
                    LivekitModels.TrackSource.SCREEN_SHARE,
                    LivekitModels.TrackSource.SCREEN_SHARE_AUDIO));
        } else if (allowed) {
            addIfMissing(sources, LivekitModels.TrackSource.MICROPHONE);
        } else {
            sources.remove(LivekitModels.TrackSource.MICROPHONE);
        }
        if (sources.equals(builder.getCanPublishSourcesList())) {
            return; // права вже такі, як треба — зайвого запиту до LiveKit не робимо
        }
        builder.clearCanPublishSources().addAllCanPublishSources(sources);
        runOrThrow(
                client.updateParticipant(roomName, participant.getIdentity(), null, null, builder.build()),
                allowed ? "unmute_failed" : "mute_failed",
                allowed ? "Не вдалося повернути право на мікрофон" : "Не вдалося заборонити мікрофон");
    }

    private LivekitModels.ParticipantPermission.Builder basePermission(LivekitModels.ParticipantInfo participant) {
        if (participant != null && participant.hasPermission()) {
            return participant.getPermission().toBuilder();
        }
        return LivekitModels.ParticipantPermission.newBuilder()
                .setCanSubscribe(true)
                .setCanPublish(true)
                .setCanPublishData(true);
    }

    private void addIfMissing(List<LivekitModels.TrackSource> sources, LivekitModels.TrackSource source) {
        if (!sources.contains(source)) {
            sources.add(source);
        }
    }

    private LivekitModels.ParticipantInfo findParticipant(String roomName, String identity) {
        for (LivekitModels.ParticipantInfo participant : listParticipants(roomName)) {
            if (participant.getIdentity().equals(identity)) {
                return participant;
            }
        }
        return null;
    }

    private List<LivekitModels.ParticipantInfo> listParticipants(String roomName) {
        try {
            var response = client.listParticipants(roomName).execute();
            if (!response.isSuccessful() || response.body() == null) {
                return List.of();
            }
            return response.body();
        } catch (IOException e) {
            return List.of();
        }
    }

    private <T> void runOrThrow(Call<T> call, String code, String message) {
        try {
            Response<T> response = call.execute();
            if (!response.isSuccessful()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, code, message);
            }
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, code, message);
        }
    }
}
