package evelyn.site.socialmedia.service;

import evelyn.site.socialmedia.dto.FriendDTO;
import evelyn.site.socialmedia.dto.UserDTO;
import evelyn.site.socialmedia.model.UserProfile;

import java.util.List;

public interface UserService {
    List<UserDTO> findUsersByName(String username, String currentUserId);

    UserDTO findFriendshipById(String userId, String currentUserId);

    List<FriendDTO> findFriendsByName(String username, String currentUserId);

    List<UserProfile> findFriendByUserId(String userId);
}
