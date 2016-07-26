<?php
	require_once 'db_functions.php';

	function createTour($userid, $name, $pic_name, $description, $services, $price, $numofguests, $places) {
		$connection = db_connect();
		$status = 'active';

		// Check connection
		if (!$connection) {
			die("Connection failed: " . $connection->connect_error);
		}

		// Check if places exist
		$db_places = [];
		if(func_num_args() >= 8) {
			$stmt = $connection->prepare("SELECT place_id FROM places WHERE place_id=?");
			foreach($places as $place) {
				$stored_places = array();
				$stmt->bind_param("s", $place['details']['place_id']);
				$stmt->execute();
				$stmt->bind_result($place_id);
				while($stmt->fetch()) {
					array_push($stored_places, $place_id);
				}
				if(empty($stored_places)) {
					$stmt = $connection->prepare("INSERT INTO places (place_id, name) VALUES (?,?)");
					$stmt->bind_param("ss", $place['details']['place_id'], $place['details']['name']);
					$place_result = $stmt->execute();
					if($place_result) {
						array_push($db_places, $place['details']['place_id']);
					}
					$stmt = $connection->prepare("SELECT place_id FROM places WHERE place_id=?");
				} else {
					foreach($stored_places as $stored_places_id) {
						array_push($db_places, $stored_places_id);
					}
				}
			}
		}

		// Prepare and bind
		$stmt = $connection->prepare("INSERT INTO tours (userid, status, name, description, picture, services, price, numofguests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
		$stmt->bind_param("isssssdi", $userid, $status, $name, $description, $pic_name, $services, $price, $numofguests);

		// Execute the statement
		$result = $stmt->execute();
		$result_id = $stmt->insert_id;
		$indv_place = "";

		if($result && !empty($db_places)) {
			$stmt = $connection->prepare("INSERT INTO tours_places (tourid, placeid) VALUES (?,?)");
			$stmt->bind_param("is", $result_id, $indv_place);

			foreach($db_places as $db_place) {
				$indv_place = $db_place;
				$result_tour_places = $stmt->execute();
			}
		}

		// Close the statement
		$stmt->close();
		$connection->close();

		// Return the result
		return $result;
	}






?>