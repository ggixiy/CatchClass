package com.catchclass.room.internal.livekit;

import java.io.IOException;
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
            for (LivekitModels.TrackInfo track : participant.getTracksList()) {
                if (track.getType() == LivekitModels.TrackType.AUDIO && !track.getMuted()) {
                    runOrThrow(
                            client.mutePublishedTrack(roomName, participant.getIdentity(), track.getSid(), true),
                            "mute_failed", "Не вдалося заглушити учасника");
                }
            }
        }
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
