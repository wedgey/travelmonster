<?php
	require_once 'db_functions.php';
	use \Firebase\JWT\JWT;

	function generateToken($user) {
		$config = parse_ini_file(__DIR__.'/../config.ini');

	    $tokenId    = base64_encode($user['id']);
	    $issuedAt   = time();
	    $notBefore  = $issuedAt;             //Adding 10 seconds
	    $expire     = $notBefore + 604800;            // Adding 1 week
	    $serverName = $config['serverName']; // Retrieve the server name from config file
	    
	    /*
	     * Create the token as an array
	     */
	    $data = [
	        'iat'  => $issuedAt,         // Issued at: time when the token was generated
	        'jti'  => $tokenId,          // Json Token Id: an unique identifier for the token
	        'iss'  => $serverName,       // Issuer
	        'nbf'  => $notBefore,        // Not before
	        'exp'  => $expire,           // Expire
	        'data' => $user
	    ];

	    $secretKey = $config['jwt_secret_key'];

	    $jwt = JWT::encode(
	    	$data,
	    	$secretKey,
	    	'HS512'
	    	);
	    $unencodedArray = ['jwt' => $jwt];
	    return json_encode($unencodedArray);
	}

	/**function register(array $creds) {

		$firstname = db_quote($creds['firstname']);
		$lastname = db_quote($creds['lastname']);
		$email = db_quote($creds['email']);
		$password = password_hash(base64_encode(hash('sha256', db_quote($creds['password']), true)), PASSWORD_BCRYPT);
		$dateofbirth = db_quote($creds['dateofbirth']);
		$country = db_quote($creds['country']);
		$city = db_quote($creds['city']);

		$query = "INSERT INTO users (firstname,lastname,email,password,dob,country,city) VALUES ('$firstname','$lastname','$email','$password','$dateofbirth','$country','$city')";
		return db_query($query);

		$connection = db_connect();
		$status = 'active';

		// Check connection
		if (!$connection) {
			die("Connection failed: " . $connection->connect_error);
		}

		// Check if user exists
		$stmt = $connection->prepare("SELECT id FROM users WHERE email=?");

	}**/

	function register(array $creds) {

		$firstname = $creds['firstname'];
		$lastname = $creds['lastname'];
		$email = $creds['email'];
		$password = password_hash(base64_encode(hash('sha256', $creds['password'], true)), PASSWORD_BCRYPT);
		$dateofbirth = $creds['dateofbirth'];
		$country = $creds['country'];
		$city = $creds['city'];
		$citydetails = $creds['citydetails'];

		$connection = db_connect();

		// Check connection
		if (!$connection) {
			die("Connection failed: " . $connection->connect_error);
		}

		// Check if user exists
		$stmt = $connection->prepare("SELECT id FROM users WHERE email=?");
		$stmt->bind_param("s", $email);
		$result = $stmt->execute();
		$num_of_rows = $stmt->num_rows;
		$stmt->close();

		if($result == false || $num_of_rows > 0) {
			$connection->close();
			return false;
		} else {
			$stmt = $connection->prepare("INSERT INTO users (firstname, lastname, email, password, dob, country, city) VALUES (?, ?, ?, ?, ?, ?, ?)");
			echo $connection->error;
			$stmt->bind_param("sssssss", $firstname, $lastname, $email, $password, $dateofbirth, $country, $city);
			$result = $stmt->execute();
			$stmt->close();
			$connection->close();
			return $result;
		}
		
	}

	/**function login(array $creds) {
		$username = db_quote($creds['email']);
		$password = base64_encode(hash('sha256', $creds['password'], true));
		$sql_select_user = "SELECT id,password FROM users WHERE email='$username'";
		$selected_user = db_select($sql_select_user);
		if (!empty($selected_user)) {
			if (password_verify($password,$selected_user[0]['password'])) {
				$sql_query = "SELECT users.id, users.firstname, users.lastname, count(messagerecipients.messageid) as numofunreadmsgs, count(DISTINCT tourguides.id) as numoftourguides FROM users LEFT JOIN  messagerecipients ON users.id=messagerecipients.recipientid LEFT JOIN tourguides ON users.id=tourguides.userid WHERE users.id='". $selected_user[0]['id'] . "' AND messagerecipients.status='unread'";
				$user = db_select($sql_query);

				if ($user !== false) {
					$result['id'] = $user[0]['id'];
					$result['firstname'] = $user[0]['firstname'];
					$result['lastname'] = $user[0]['lastname'];
					$result['numofunreadmsgs'] = $user[0]['numofunreadmsgs'];
					$result['numoftourguides'] = $user[0]['numoftourguides'];
					return $result;
				} else {
					return "No User Found.";
				}
			} else {
				return "The password was incorrect.";
			}
		} else {
			return "No users were found using that email.";
		}
	}**/

	function login(array $creds) {
		$username = $creds['email'];
		$password = base64_encode(hash('sha256', $creds['password'], true));
		$user = [];

		$connection = db_connect();

		// Check connection
		if (!$connection) {
			die("Connection failed: " . $connection->connect_error);
		}

		$stmt = $connection->prepare("SELECT users.id, users.firstname, users.lastname, users.password, count(messagerecipients.messageid) as numofunreadmsgs, count(DISTINCT tourguides.id) as numoftourguides FROM users LEFT JOIN messagerecipients ON users.id=messagerecipients.recipientid LEFT JOIN tourguides ON users.id=tourguides.userid WHERE users.email=? AND messagerecipients.status='unread'");

		$stmt->bind_param("s", $username);
		$stmt->execute();
		if($stmt->execute()) {
			$stmt->bind_result($user_id, $user_firstname, $user_lastname, $user_password, $user_numofunreadmsgs, $user_tourguide);
			while($stmt->fetch()) {
				$user['id'] = $user_id;
				$user['firstname'] = $user_firstname;
				$user['lastname'] = $user_lastname;
				$user['numofunreadmsgs'] = $user_numofunreadmsgs;
				$user['numoftourguides'] = $user_tourguide;
				$user['password'] = $user_password;
			}
			$stmt->close();
			$connection->close();
			if(password_verify($password,$user['password'])) {
				array_pop($user);
				return $user;
			} else {
				return "Sorry, the password you entered is not correct.";
			}
		} else {
			$stmt->close();
			$connection->close();
			return "Sorry, we couldn't find a user with that email address.";
		}

	}

	function checkUserExists($email) {
		$connection = db_connect();

		// Check connection
		if (!$connection) {
			die("Connection failed: " . $connection->connect_error);
		}

		$stmt = $connection->prepare("SELECT password FROM users WHERE ");
	}

	function registerGuide($user, array $creds) {
		$userid = db_quote($user);

		$sql_guide_exists = "SELECT id FROM tourguides WHERE userid='$userid'";
		$guide_exists = db_select($sql_guide_exists);

		if(empty($guide_exists)) {
			$g_maincity = db_quote($creds['g_maincity']);
			$g_subcities = db_quote($creds['g_subcities']);
			$g_address = db_quote($creds['g_address']);
			$g_phone = db_quote($creds['g_phone']);
			$g_mobile = db_quote($creds['g_mobile']);
			$g_languages = db_quote($creds['g_languages']);
			$g_company = db_quote($creds['g_company']);
			$g_info = db_quote($creds['g_info']);
			$g_services = db_quote($creds['g_services']);

			$query = "INSERT INTO tourguides (userid,company,maincity,subcity,information,address,phone,mobile,languages,services) VALUES ('$userid','$g_company','$g_maincity','$g_subcities','$g_info','$g_address','$g_phone','$g_mobile','$g_languages','$g_services')";

			return db_query($query);
		} else {
			return false;
		}
	}

	function logout() {
		if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] == true) {
			session_destroy();
			return "Logged out.";
		} else {
			return "You are not logged in.";
		}
	}

	function getUserInfo($userid) {
		$user = db_quote($userid);
		$sql_query = "SELECT * FROM users WHERE id=$user";
		return db_select($sql_query);
	}

	function getUserUnreadMessages($userid) {

	}

?>