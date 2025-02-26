package evelyn.site.socialmedia.security;

import evelyn.site.socialmedia.model.Users;
import evelyn.site.socialmedia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Users user;
        Optional<Users> users = userRepository.findByEmail(email);
        if (users.isPresent()) {
            user = users.get();
        } else {
            throw new UsernameNotFoundException(email);
        }

        return buildUserDetails(user);
    }

    private UserDetails buildUserDetails(Users user) {
        return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), Collections.emptyList()); // Assuming no roles for simplicity
    }
}