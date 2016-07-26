<?php
	function validateName($name) {
		if(isset($name)) {
			$validated_name = strip_tags(trim($name));
			if(strlen($validated_name) >= 1 && strlen($validated_name) <= 255) {
				return $validated_name;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	function validateText($text) {
		if(isset($text)) {
			if(strlen($text) <= 2000) {
				$text = trim($text);
				return $text;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	function validateEmail($email) {
		if(isset($email)) {
			if(filter_var($email, FILTER_VALIDATE_EMAIL)) {
				return $email;
			}
		} else {
			return false;
		}
	}

	function validatePrice($price) {
		if(isset($price) && is_numeric($price)) {
			return $price;
		} else {
			return false;
		}
	}

	function validateServices($services) {
		$avail_services = explode(",", $services);
		$allowed_services = array('transport','meals', 'licensed', 'depth');

		if(isset($avail_services)) {
			foreach($avail_services as $value) {
				if(!in_array($value, $allowed_services)) {
					return false;
				}
			}
			return $services;
		} else {
			return false;
		}
	}

	function validateNumOfGuests($numofguests) {
		if(isset($numofguests)) {
			if(filter_var($numofguests, FILTER_VALIDATE_INT)) {
				return $numofguests;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	function fileUpload($file) {
		$problem = false;
		// Check if there is a file
		if(!isset($file)) {
			return $problem;
		}

		// Allow only image files
		$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
		$allowed = array('gif', 'png', 'jpg', 'jpeg');
		if(!in_array($ext, $allowed)) {
			echo 'The file is not an allowed type!';
			$problem = true;
			return $problem;
		}

		// Allow by MIME Types
		$allowedMIMES = array('image/png','image/jpeg','image/gif');

		if(!in_array($file['type'], $allowedMIMES)) {
			echo 'The file must be an image file.';
			$problem = true;
			return $problem;
		}

		// Securely check MIME using finfo
		$fi = finfo_open(FILEINFO_MIME_TYPE);
		$mime = finfo_file($fi, $file['tmp_name']);
		finfo_close($fi);

		if(!in_array($mime, $allowedMIMES)) {
			echo 'The file must be an image type.';
			$problem = true;
			return $problem;
		}

		// Generate a random name for the file
		$new_name = md5($file['name'] . microtime());
		$new_name .= '.' . $ext;

		$destination =  '../../assets/tour_images/' . $new_name;

		// Store the file
		if(!$problem) {
			if(move_uploaded_file( $file['tmp_name'] , $destination)) {
				return $new_name;
			}
		} else {
			echo 'An error has occurred and your picture could not be uploaded.';
			return false;
		}
	}
?>