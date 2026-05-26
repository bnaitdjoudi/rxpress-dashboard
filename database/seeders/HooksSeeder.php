<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HooksSeeder extends Seeder
{
    public function run(): void
    {
        $hooks = [
            // Posts
            ['category' => 'Posts', 'hook' => 'publish_post', 'label' => "Publication d'un article"],
            ['category' => 'Posts', 'hook' => 'save_post', 'label' => "Sauvegarde d'un article"],
            ['category' => 'Posts', 'hook' => 'delete_post', 'label' => "Suppression d'un article"],
            ['category' => 'Posts', 'hook' => 'transition_post_status', 'label' => "Changement de statut d'un article"],
            ['category' => 'Posts', 'hook' => 'wp_trash_post', 'label' => 'Mise à la corbeille'],

            // Pages
            ['category' => 'Pages', 'hook' => 'publish_page', 'label' => "Publication d'une page"],
            ['category' => 'Pages', 'hook' => 'save_page', 'label' => "Sauvegarde d'une page"],
            ['category' => 'Pages', 'hook' => 'delete_page', 'label' => "Suppression d'une page"],

            // Commentaires
            ['category' => 'Commentaires', 'hook' => 'comment_post', 'label' => 'Nouveau commentaire'],
            ['category' => 'Commentaires', 'hook' => 'edit_comment', 'label' => "Modification d'un commentaire"],
            ['category' => 'Commentaires', 'hook' => 'delete_comment', 'label' => "Suppression d'un commentaire"],
            ['category' => 'Commentaires', 'hook' => 'wp_set_comment_status', 'label' => "Changement de statut d'un commentaire"],

            // Utilisateurs
            ['category' => 'Utilisateurs', 'hook' => 'user_register', 'label' => "Inscription d'un utilisateur"],
            ['category' => 'Utilisateurs', 'hook' => 'profile_update', 'label' => 'Mise à jour du profil'],
            ['category' => 'Utilisateurs', 'hook' => 'delete_user', 'label' => "Suppression d'un utilisateur"],
            ['category' => 'Utilisateurs', 'hook' => 'wp_login', 'label' => 'Connexion'],
            ['category' => 'Utilisateurs', 'hook' => 'wp_logout', 'label' => 'Déconnexion'],

            // Médias
            ['category' => 'Médias', 'hook' => 'add_attachment', 'label' => "Upload d'un média"],
            ['category' => 'Médias', 'hook' => 'edit_attachment', 'label' => "Modification d'un média"],
            ['category' => 'Médias', 'hook' => 'delete_attachment', 'label' => "Suppression d'un média"],

            // Taxonomies
            ['category' => 'Taxonomies', 'hook' => 'created_term', 'label' => "Création d'un terme"],
            ['category' => 'Taxonomies', 'hook' => 'edited_term', 'label' => "Modification d'un terme"],
            ['category' => 'Taxonomies', 'hook' => 'delete_term', 'label' => "Suppression d'un terme"],

            // WooCommerce
            ['category' => 'WooCommerce', 'hook' => 'woocommerce_new_order', 'label' => 'Nouvelle commande'],
            ['category' => 'WooCommerce', 'hook' => 'woocommerce_order_status_changed', 'label' => 'Changement de statut de commande'],
            ['category' => 'WooCommerce', 'hook' => 'woocommerce_payment_complete', 'label' => 'Paiement complété'],
            ['category' => 'WooCommerce', 'hook' => 'woocommerce_new_product', 'label' => 'Nouveau produit'],
            ['category' => 'WooCommerce', 'hook' => 'woocommerce_update_product', 'label' => 'Mise à jour produit'],
            ['category' => 'WooCommerce', 'hook' => 'woocommerce_created_customer', 'label' => 'Nouveau client'],
        ];

        $now = now();

        foreach ($hooks as $hook) {
            DB::table('hooks')->updateOrInsert(
                ['hook' => $hook['hook'], 'user_id' => null],
                [
                    'user_id'    => null,
                    'label'      => $hook['label'],
                    'category'   => $hook['category'],
                    'origine'    => 'proprietaire',
                    'listed'     => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
