<?php
require_once 'database.php';
use \Firebase\JWT\JWT;
class User {
	public $id, $firstname, $lastname, $email, $dob, $country, $city, $picture, $gender, $description, $language, $timezone, $address, $datecreated, $lastseen, $numofunreadmsgs, $numoftourguides;
	public $error_msg;

	public function __construct($id = NULL) {
		if($id !== NULL) {
			$connection = getDb();

			$stmt = $connection->prepare("SELECT * FROM users WHERE id=?");
			$stmt->bind_param('i', $id);
			$result = $stmt->execute();
			$num_rows = $stmt->num_rows;
			if($result == true && $num_rows == 1) {
				$result_set = $stmt->get_result();
				while($row = $result_set->fetch_assoc()) {
					$this->id = $row['id'];
					$this->firstname = $row['firstname'];
					$this->lastname = $row['lastname'];
					$this->email = $row['email'];
					$this->dob = $row['dob'];
					$this->country = $row['country'];
					$this->city = $row['city'];
					$this->description = $row['description'];
					$this->language = $row['language'];
					$this->timezone = $row['timezone'];
					$this->address = $row['address'];
					$this->datecreated = $row['datecreated'];
					$this->lastseen = $row['lastseen'];
				}
			} else {
				$this->error_msg = "There was a problem getting this user.";
			}
		}
	}

	public function register(array $creds) {
		$firstname = $creds['firstname'];
		$lastname = $creds['lastname'];
		$email = $creds['email'];
		$password = password_hash(base64_encode(hash('sha256', $creds['password'], true)), PASSWORD_BCRYPT);
		$dateofbirth = $creds['dateofbirth'];
		$country = $creds['country'];
		$city = $creds['city'];
		$citydetails = $creds['citydetails'];

		$connection = getDB();

		// Check if user exists
		$stmt = $connection->prepare("SELECT id FROM users WHERE email=?");
		$stmt->bind_param("s", $email);
		$result = $stmt->execute();
		$num_of_rows = $stmt->num_rows;
		$stmt->bind_result($id);
		while($stmt->fetch()) {
		}
		$stmt->close();

		if($result == false || $num_of_rows > 0) {
			$connection->close();
			return false;
		} else {
			$stmt = $connection->prepare("INSERT INTO users (firstname, lastname, email, password, dob, country, city) VALUES (?, ?, ?, ?, ?, ?, ?)");
			$stmt->bind_param("sssssss", $firstname, $lastname, $email, $password, $dateofbirth, $country, $city);
			$result = $stmt->execute();
			$stmt->close();
			$connection->close();
			return $result;
		}
	}

	public function login($in_email, $in_password) {
		$in_password = base64_encode(hash('sha256', $in_password, true));
		$connection = getDb();

		$stmt = $connection->prepare("SELECT users.id, users.firstname, users.lastname, users.password, count(messagerecipients.messageid) as numofunreadmsgs, count(DISTINCT tourguides.id) as numoftourguides FROM users LEFT JOIN messagerecipients ON users.id=messagerecipients.recipientid LEFT JOIN tourguides ON users.id=tourguides.userid WHERE users.email=? AND messagerecipients.status='unread'");
		$stmt->bind_param("s", $in_email);
		$stmt->execute();

		if($stmt->execute()) {
			$stmt->bind_result($user_id, $user_firstname, $user_lastname, $user_password, $user_numofunreadmsgs, $user_tourguide);
			while($stmt->fetch()) {				
				$id = $user_id;
				$firstname = $user_firstname;
				$lastname = $user_lastname;
				$numofunreadmsgs = $user_numofunreadmsgs;
				$numoftourguides = $user_tourguide;
				$password = $user_password;
			}
			$stmt->close();
			$connection->close();
			if(password_verify($in_password,$password)) {
				$this->id = $id;
				$this->firstname = $firstname;
				$this->lastname = $lastname;
				$this->numofunreadmsgs = $numofunreadmsgs;
				$this->numoftourguides = $numoftourguides;
				return true;
			} else {
				$this->error_msg = "Sorry, the password you entered is not correct.";
				return false;
			}
		} else {
			$stmt->close();
			$connection->close();
			$this->error_msg = "Sorry, we couldn't find a user with that email address.";
			return false;
		}
	}
	
	public function generateToken($user = NULL) {
		if($user === NULL) {
			$data = array(
	        	'id' => $this->id,
				'firstname' => $this->firstname,
				'lastname' => $this->lastname,
				'numofunreadmsgs' => $this->numofunreadmsgs,
				'numoftourguides' => $this->numoftourguides,
	        	);
		} else {
			$data = $user;
		}

		$config = parse_ini_file('config.ini');
	    $tokenId    = base64_encode($this->id);
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
	        'data' => $data
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
}
?>